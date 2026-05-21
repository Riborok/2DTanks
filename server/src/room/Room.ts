import { WebSocket } from 'ws';
import { GameWorld } from '../game/world/GameWorld';
import { TankConfig } from '../utils/types';
import type { WsAuthUser } from '../auth/types';
import { getPool } from '../db/pool';
import * as matchRepo from '../repos/matchRepo';
import * as replayRepo from '../repos/replayRepo';
import { getRandomInt } from '../utils/additionalFunc';
import type { GameWorldEndResult, PlayerMatchStats } from '../game/world/gameWorldEndResult';
import { GAMEPLAY_CONFIG } from '../constants/gameConstants';

type PlayerRole = 'attacker' | 'defender' | 'fighter';

interface Player {
    id: string;
    ws: WebSocket | null;
    role: PlayerRole | null;
    tankConfig: TankConfig | null;
    ready: boolean;
    userId: string | null;
    displayName: string | null;
}

/**
 * Наблюдатель не участвует в игре, но получает снапшоты и room-update.
 * Каждый наблюдатель — отдельный WS, может быть один и тот же userId на
 * нескольких вкладках, поэтому ключ — собственный spectator_id.
 */
interface Spectator {
    id: string;
    ws: WebSocket;
    userId: string | null;
    displayName: string | null;
}

export type RoomCreateOptions = {
    singlePlayerTest?: boolean;
    practiceMode?: boolean;
    deathmatchMode?: boolean;
};

export class Room {
    private code: string;
    private players: Map<string, Player> = new Map();
    private spectators: Map<string, Spectator> = new Map();
    private gameWorld: GameWorld | null = null;
    private gameLoopInterval: NodeJS.Timeout | null = null;
    /** true между созданием gameWorld и запуском setInterval (внутри await — может зайти наблюдатель). */
    private simulationStarting: boolean = false;
    private lastGameLoopTime: number = 0;
    private readonly TICK_RATE = GAMEPLAY_CONFIG.COMMON.SERVER_TICK_RATE;
    private readonly TICK_INTERVAL = 1000 / this.TICK_RATE;
    /**
     * Фиксированный шаг симуляции. Обязательно совпадает с шагом реплея
     * (replaySimulator → stepMs = 1000 / tickRate), иначе live-физика и
     * воспроизведение разъезжаются на первом же лаг-фрейме.
     */
    private readonly FIXED_DELTA_MS = 1000 / 60;
    private readonly singlePlayerTest: boolean;
    /** Два игрока: не пишем матч в БД, без лимита времени в мире. */
    private readonly practiceMode: boolean;
    /** FFA 2–5 игроков, 60 с, киллы. */
    private readonly deathmatchMode: boolean;
    private readonly maxPlayers: number;
    private matchId: string | null = null;
    /** Журнал реплея: world_init, item_spawn, player_input (сохраняется в match_replay_actions.events). */
    private replayEvents: replayRepo.ReplayEvent[] = [];
    private replayStartMeta: replayRepo.ReplayStartMeta | null = null;
    private replayRngSeed: number = 0;
    /** Журнал: world_init, item_spawn, player_input (~60 Гц на клиента при зажатых клавишах). 20000 хватало лишь на несколько минут и реплей «немел». */
    private static readonly REPLAY_MAX_ACTIONS = 500000;

    constructor(code: string, options?: RoomCreateOptions) {
        this.code = code;
        this.singlePlayerTest = options?.singlePlayerTest === true;
        this.deathmatchMode = options?.deathmatchMode === true && !this.singlePlayerTest;
        this.practiceMode =
            options?.practiceMode === true && !this.singlePlayerTest && !this.deathmatchMode;
        if (this.singlePlayerTest) {
            this.maxPlayers = GAMEPLAY_CONFIG.MAZE.SOLO_MAX_PLAYERS;
        } else if (this.deathmatchMode) {
            this.maxPlayers = GAMEPLAY_CONFIG.ARENA.MAX_PLAYERS;
        } else {
            this.maxPlayers = GAMEPLAY_CONFIG.MAZE.STANDARD_MAX_PLAYERS;
        }
    }

    public get roomCode(): string {
        return this.code;
    }

    public getPlayer(playerId: string): { id: string; role: PlayerRole | null } | undefined {
        const p = this.players.get(playerId);
        if (!p) return undefined;
        return { id: p.id, role: p.role };
    }

    public getPublicState(): any {
        const playersArray = Array.from(this.players.values()).map(player => ({
            playerId: player.id,
            role: player.role,
            tankConfig: player.tankConfig,
            ready: player.ready,
            userId: player.userId ?? undefined,
            displayName: player.displayName ?? undefined
        }));
        return {
            players: playersArray,
            singlePlayerTest: this.singlePlayerTest,
            practiceMode: this.practiceMode,
            deathmatchMode: this.deathmatchMode
        };
    }

    addPlayer(ws: WebSocket | null, auth: WsAuthUser | null = null): string | null {
        if (auth?.userId) {
            for (const player of this.players.values()) {
                if (player.userId === auth.userId) {
                    player.ws = ws;
                    player.displayName = auth.displayName ?? player.displayName;
                    if (ws) {
                        this.sendJoinedState(ws, player);
                        console.log(`[ROOM ${this.code}] User ${auth.userId} reattached as ${player.id}`);
                    }
                    this.broadcastRoomUpdate();
                    return player.id;
                }
            }
        }

        if (this.players.size >= this.maxPlayers) {
            return null;
        }

        const playerId = `player_${Date.now()}_${Math.random()}`;
        const role: PlayerRole = this.deathmatchMode
            ? 'fighter'
            : this.players.size === 0
              ? 'attacker'
              : 'defender';

        const player: Player = {
            id: playerId,
            ws,
            role,
            tankConfig: null,
            ready: false,
            userId: auth?.userId ?? null,
            displayName: auth?.displayName ?? null
        };

        this.players.set(playerId, player);

        // Send join confirmation
        if (ws) {
            this.sendJoinedState(ws, player);
            console.log(
                `[ROOM ${this.code}] Player ${playerId} joined as ${role} (total: ${this.players.size}/${this.maxPlayers})`
            );
        }

        // Broadcast room update to all players
        this.broadcastRoomUpdate();

        return playerId;
    }

    reconnectPlayerByUserId(ws: WebSocket, auth: WsAuthUser): { playerId: string; role: PlayerRole | null } | null {
        for (const player of this.players.values()) {
            if (player.userId && player.userId === auth.userId) {
                player.ws = ws;
                player.displayName = auth.displayName ?? player.displayName;
                this.sendJoinedState(ws, player);
                this.broadcastRoomUpdate();
                return { playerId: player.id, role: player.role };
            }
        }
        return null;
    }

    updatePlayerWebSocket(playerId: string, ws: WebSocket): void {
        const player = this.players.get(playerId);
        if (player) {
            player.ws = ws;
            // Send join confirmation if not already sent
            ws.send(JSON.stringify({
                type: 'joined',
                roomId: this.code,
                playerId: playerId,
                role: player.role
            }));
            // Broadcast room update to all players
            this.broadcastRoomUpdate();
        }
    }

    isPlayerCurrentSocket(playerId: string, ws: WebSocket): boolean {
        return this.players.get(playerId)?.ws === ws;
    }

    setTankConfig(playerId: string, config: TankConfig): { success: boolean; message?: string } {
        const player = this.players.get(playerId);
        if (!player) {
            return { success: false, message: 'Player not found' };
        }

        // Check if color is already taken by another player
        for (const otherPlayer of this.players.values()) {
            if (otherPlayer.id !== playerId && otherPlayer.tankConfig && otherPlayer.tankConfig.color === config.color) {
                console.log(`[ROOM ${this.code}] Player ${playerId} tried to select color ${config.color} but it's already taken by ${otherPlayer.id}`);
                return { success: false, message: `Color ${config.color} is already selected by another player` };
            }
        }

        player.tankConfig = config;
        console.log(`[ROOM ${this.code}] Player ${playerId} (${player.role}) selected tank config with color ${config.color}`);
        this.broadcastRoomUpdate();
        return { success: true };
    }

    setReady(playerId: string, ready: boolean): { success: boolean; message?: string } {
        const player = this.players.get(playerId);
        if (!player) {
            return { success: false, message: 'Player not found' };
        }

        // Can't be ready without tank config
        if (ready && !player.tankConfig) {
            console.log(`[ROOM ${this.code}] Player ${playerId} tried to become ready without tank config`);
            return { success: false, message: 'Cannot become ready without selecting a tank' };
        }

        player.ready = ready;
        console.log(`[ROOM ${this.code}] Player ${playerId} (${player.role}) ready status: ${ready}`);
        this.broadcastRoomUpdate();

        // Check if both players are ready
        if (ready && this.areAllPlayersReady()) {
            console.log(`[ROOM ${this.code}] All players ready - starting game!`);
            void this.startGameAsync();
        }

        return { success: true };
    }

    private areAllPlayersReady(): boolean {
        if (this.singlePlayerTest) {
            if (this.players.size !== 1)
                return false;
            const only = [...this.players.values()][0];
            return only.role === 'attacker' && !!only.tankConfig && only.ready;
        }

        if (this.deathmatchMode) {
            const n = this.players.size;
            if (n < 2 || n > 5) {
                return false;
            }
            for (const player of this.players.values()) {
                if (!player.tankConfig || !player.ready) {
                    return false;
                }
            }
            return true;
        }

        if (this.players.size < 2)
            return false;

        for (const player of this.players.values()) {
            if (!player.tankConfig || !player.ready) {
                return false;
            }
        }

        return true;
    }

    private async startGameAsync(): Promise<void> {
        this.simulationStarting = false;
        this.matchId = null;
        this.replayEvents = [];
        this.replayStartMeta = null;
        this.replayRngSeed = (Date.now() ^ getRandomInt(1, 2 ** 30 - 1)) >>> 0;
        const playersArray = Array.from(this.players.values());
        const attacker = playersArray.find(p => p.role === 'attacker');

        if (this.deathmatchMode) {
            const fighters = playersArray
                .filter((p) => p.tankConfig)
                .map((p) => ({ playerId: p.id, config: p.tankConfig! }));
            if (fighters.length < 2) {
                console.log(`[ROOM ${this.code}] Deathmatch: not enough fighters`);
                return;
            }
            const surface = getRandomInt(0, 2);
            const cfg0 = fighters[0].config;
            console.log(`[ROOM ${this.code}] Starting deathmatch (${fighters.length} players), surface ${surface}`);
            this.gameWorld = new GameWorld(
                cfg0,
                cfg0,
                this.code,
                false,
                false,
                {
                    surfaceMaterial: surface,
                    fighters
                },
                this.replayRngSeed
            );
        } else if (this.singlePlayerTest) {
            if (!attacker || !attacker.tankConfig) {
                console.log(`[ROOM ${this.code}] Cannot start solo game - missing attacker config`);
                return;
            }
            console.log(`[ROOM ${this.code}] Starting solo test game for attacker ${attacker.id}`);
            this.gameWorld = new GameWorld(attacker.tankConfig, attacker.tankConfig, this.code, true, false);
            this.gameWorld.setPlayerTankMapping(attacker.id, '');
        } else {
            const defender = playersArray.find(p => p.role === 'defender');
            if (!attacker || !defender || !attacker.tankConfig || !defender.tankConfig) {
                console.log(`[ROOM ${this.code}] Cannot start game - missing players or configs`);
                return;
            }
            console.log(
                `[ROOM ${this.code}] Starting game for attacker ${attacker.id} and defender ${defender.id}` +
                    (this.practiceMode ? ' (practice)' : '')
            );
            this.gameWorld = new GameWorld(
                attacker.tankConfig,
                defender.tankConfig,
                this.code,
                false,
                this.practiceMode,
                undefined,
                this.replayRngSeed
            );
            this.gameWorld.setPlayerTankMapping(attacker.id, defender.id);
        }

        this.simulationStarting = true;
        try {
        const pool = getPool();
        if (pool && !this.singlePlayerTest && this.gameWorld) {
            try {
                if (this.deathmatchMode) {
                    const fightersOrdered = playersArray
                        .filter((p) => p.tankConfig)
                        .map((p) => ({
                            playerId: p.id,
                            userId: p.userId,
                            config: p.tankConfig!
                        }));
                    this.matchId = await matchRepo.createMatchWithParticipants(pool, {
                        roomCode: this.code,
                        matchTypeCode: 'kill_time',
                        players: fightersOrdered.map((f) => ({
                            userId: f.userId,
                            role: 'fighter' as const,
                            tankConfig: f.config
                        }))
                    });
                    if (this.matchId) {
                        this.replayStartMeta = {
                            mode: 'deathmatch',
                            tickRate: this.TICK_RATE,
                            rngSeed: this.replayRngSeed,
                            surfaceMaterial: this.gameWorld.getDeathmatchSurfaceMaterial(),
                            fighters: fightersOrdered.map(({ playerId, config }) => ({ playerId, config }))
                        };
                    }
                } else {
                    const defender = playersArray.find((p) => p.role === 'defender');
                    if (attacker && defender && attacker.tankConfig && defender.tankConfig) {
                        const participants: matchRepo.MatchParticipantInput[] = [];
                        for (const p of playersArray) {
                            if (p.role && p.tankConfig && (p.role === 'attacker' || p.role === 'defender')) {
                                participants.push({
                                    userId: p.userId,
                                    role: p.role,
                                    tankConfig: p.tankConfig
                                });
                            }
                        }
                        this.matchId = await matchRepo.createMatchWithParticipants(pool, {
                            roomCode: this.code,
                            matchTypeCode: 'standard',
                            players: participants
                        });
                        if (this.matchId) {
                            this.replayStartMeta = {
                                mode: 'standard',
                                tickRate: this.TICK_RATE,
                                attackerPlayerId: attacker.id,
                                defenderPlayerId: defender.id,
                                attackerConfig: attacker.tankConfig,
                                defenderConfig: defender.tankConfig,
                                rngSeed: this.replayRngSeed
                            };
                        }
                    }
                }
                if (this.matchId) {
                    console.log(`[ROOM ${this.code}] Match persisted: ${this.matchId}`);
                }
            } catch (err) {
                console.error(`[ROOM ${this.code}] Failed to record match start:`, err);
            }
        }

        if (this.matchId && this.replayStartMeta && this.gameWorld) {
            this.replayEvents = [];
            this.gameWorld.setReplayEventSink((ev) => {
                if (this.replayEvents.length < Room.REPLAY_MAX_ACTIONS) {
                    this.replayEvents.push(ev);
                }
            });
            this.gameWorld.pushReplayWorldInitEvent();
        }

        const gameStartPayload = JSON.stringify({ type: 'gameStart' });
        // Notify all players that game is starting
        for (const player of this.players.values()) {
            if (player.ws && player.ws.readyState === WebSocket.OPEN) {
                player.ws.send(gameStartPayload);
            }
        }
        for (const sp of this.spectators.values()) {
            if (sp.ws.readyState === WebSocket.OPEN) {
                try {
                    sp.ws.send(gameStartPayload);
                } catch {
                    /* ignore */
                }
            }
        }

        // Send initial snapshot to all players
        this.broadcastSnapshot();
        console.log(`[ROOM ${this.code}] Game started, sending snapshots at ${this.TICK_RATE} Hz`);

        this.lastGameLoopTime = Date.now();
        let accumulator = 0;
        this.gameLoopInterval = setInterval(() => {
            if (!this.gameWorld) return;
            const currentTime = Date.now();
            const wallDelta = Math.min(currentTime - this.lastGameLoopTime, 250);
            this.lastGameLoopTime = currentTime;
            accumulator += wallDelta;
            const maxTicksPerFrame = 5;
            let ticks = 0;
            while (accumulator >= this.FIXED_DELTA_MS && ticks < maxTicksPerFrame) {
                this.gameWorld.update(this.FIXED_DELTA_MS);
                accumulator -= this.FIXED_DELTA_MS;
                ticks++;
                const gameEnd = this.gameWorld.checkGameEnd();
                if (gameEnd) {
                    this.endGame(gameEnd);
                    return;
                }
            }
            if (accumulator > this.FIXED_DELTA_MS * maxTicksPerFrame) {
                accumulator = this.FIXED_DELTA_MS;
            }
            if (ticks > 0) {
                this.broadcastSnapshot();
            }
        }, this.TICK_INTERVAL);
        } finally {
            this.simulationStarting = false;
        }
    }

    handlePlayerAction(playerId: string, action: any): void {
        if (this.gameWorld) {
            if (
                this.matchId &&
                this.replayStartMeta &&
                this.replayEvents.length < Room.REPLAY_MAX_ACTIONS
            ) {
                this.replayEvents.push({
                    kind: 'player_input',
                    tick: this.gameWorld.getTick(),
                    playerId,
                    action
                });
            }
            // Фиксированный dt для детерминизма live/replay (см. replaySimulator).
            this.gameWorld.handlePlayerAction(playerId, action, this.FIXED_DELTA_MS);
        }
    }

    handleDisconnect(playerId: string, ws?: WebSocket): void {
        const player = this.players.get(playerId);
        if (player && player.ws) {
            if (ws && player.ws !== ws) {
                return;
            }
            player.ws = null;
        }
        this.broadcastRoomUpdate();
    }

    leavePlayer(playerId: string): void {
        const player = this.players.get(playerId);
        if (!player) {
            return;
        }
        player.ws = null;
        this.players.delete(playerId);
        this.broadcastRoomUpdate();
        if (this.players.size === 0) {
            this.forceCloseDueToEmpty();
        }
    }

    leaveUser(userId: string): void {
        const playerIds = Array.from(this.players.values())
            .filter((player) => player.userId === userId)
            .map((player) => player.id);
        for (const id of playerIds) {
            this.leavePlayer(id);
        }
    }

    /**
     * Рассылает произвольное сообщение всем участникам комнаты. Используется
     * для лёгких социальных фич (пинги, чат), которые не затрагивают детерминизм
     * игрового цикла и не должны попадать в запись реплея.
     */
    public broadcast(message: Record<string, any>, excludePlayerId?: string): void {
        const payload = JSON.stringify(message);
        for (const player of this.players.values()) {
            if (excludePlayerId && player.id === excludePlayerId) continue;
            if (player.ws && player.ws.readyState === WebSocket.OPEN) {
                try {
                    player.ws.send(payload);
                } catch {
                    /* ignore */
                }
            }
        }
        for (const sp of this.spectators.values()) {
            if (sp.ws.readyState === WebSocket.OPEN) {
                try {
                    sp.ws.send(payload);
                } catch {
                    /* ignore */
                }
            }
        }
    }

    /**
     * Добавить наблюдателя. Наблюдатели подключаются к уже существующей комнате
     * и получают снапшоты + room-update, но не участвуют в матче. Возвращает
     * `null`, если комната полностью пустая (без смысла смотреть).
     */
    public addSpectator(ws: WebSocket, auth: WsAuthUser | null): { spectatorId: string } | null {
        if (this.players.size === 0 && this.spectators.size === 0) {
            // Нет смысла наблюдать полностью пустую комнату
            return null;
        }
        const spectatorId = `spec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        this.spectators.set(spectatorId, {
            id: spectatorId,
            ws,
            userId: auth?.userId ?? null,
            displayName: auth?.displayName ?? null
        });
        try {
            ws.send(
                JSON.stringify({
                    type: 'spectate:joined',
                    roomId: this.code,
                    spectatorId,
                    hasActiveGame: this.hasActiveGame() || this.simulationStarting
                })
            );
        } catch {
            /* ignore */
        }
        // Отдать сразу last room state + снапшот (если идёт игра)
        try {
            const playersArray = Array.from(this.players.values()).map((player) => ({
                playerId: player.id,
                role: player.role,
                tankConfig: player.tankConfig,
                ready: player.ready,
                userId: player.userId ?? undefined,
                displayName: player.displayName ?? undefined
            }));
            ws.send(
                JSON.stringify({
                    type: 'roomUpdate',
                    players: playersArray,
                    singlePlayerTest: this.singlePlayerTest,
                    practiceMode: this.practiceMode,
                    deathmatchMode: this.deathmatchMode
                })
            );
            if (this.gameWorld) {
                ws.send(
                    JSON.stringify({
                        type: 'snapshot',
                        tick: this.gameWorld.getTick(),
                        world: this.gameWorld.getSnapshot()
                    })
                );
            }
        } catch {
            /* ignore */
        }
        console.log(`[ROOM ${this.code}] Spectator ${spectatorId} joined (total spectators: ${this.spectators.size})`);
        return { spectatorId };
    }

    public removeSpectator(spectatorId: string): void {
        if (this.spectators.delete(spectatorId)) {
            console.log(`[ROOM ${this.code}] Spectator ${spectatorId} left`);
        }
    }

    public getSpectatorCount(): number {
        return this.spectators.size;
    }

    public getPublicInfo(): {
        code: string;
        playerCount: number;
        spectatorCount: number;
        hasActiveGame: boolean;
        singlePlayerTest: boolean;
        practiceMode: boolean;
        deathmatchMode: boolean;
    } {
        return {
            code: this.code,
            playerCount: this.players.size,
            spectatorCount: this.spectators.size,
            hasActiveGame: this.hasActiveGame(),
            singlePlayerTest: this.singlePlayerTest,
            practiceMode: this.practiceMode,
            deathmatchMode: this.deathmatchMode
        };
    }

    public getPlayerDisplayName(playerId: string): string | undefined {
        return this.players.get(playerId)?.displayName ?? undefined;
    }

    private broadcastRoomUpdate(): void {
        const playersArray = Array.from(this.players.values()).map(player => ({
            playerId: player.id,
            role: player.role,
            tankConfig: player.tankConfig,
            ready: player.ready,
            userId: player.userId ?? undefined,
            displayName: player.displayName ?? undefined
        }));

        const statusSummary = playersArray.map(p => 
            `${p.role} (${p.tankConfig ? 'tank selected' : 'selecting tank'}, ${p.ready ? 'ready' : 'not ready'})`
        ).join(', ');
        console.log(`[ROOM ${this.code}] Broadcasting update: ${statusSummary}`);

        const roomUpdatePayload = JSON.stringify({
            type: 'roomUpdate',
            players: playersArray,
            singlePlayerTest: this.singlePlayerTest,
            practiceMode: this.practiceMode,
            deathmatchMode: this.deathmatchMode
        });
        for (const player of this.players.values()) {
            if (player.ws && player.ws.readyState === WebSocket.OPEN) {
                player.ws.send(roomUpdatePayload);
            }
        }
        for (const sp of this.spectators.values()) {
            if (sp.ws.readyState === WebSocket.OPEN) {
                try {
                    sp.ws.send(roomUpdatePayload);
                } catch {
                    /* ignore */
                }
            }
        }
    }

    private broadcastSnapshot(): void {
        if (!this.gameWorld) return;

        const snapshot = this.gameWorld.getSnapshot();
        
        if (snapshot.bullets && snapshot.bullets.length > 0) {
            console.log(`[ROOM ${this.code}] broadcastSnapshot: sending ${snapshot.bullets.length} bullets to clients`);
        }

        const snapshotPayload = JSON.stringify({
            type: 'snapshot',
            tick: this.gameWorld.getTick(),
            world: snapshot
        });
        for (const player of this.players.values()) {
            if (player.ws && player.ws.readyState === WebSocket.OPEN) {
                player.ws.send(snapshotPayload);
            }
        }
        for (const sp of this.spectators.values()) {
            if (sp.ws.readyState === WebSocket.OPEN) {
                try {
                    sp.ws.send(snapshotPayload);
                } catch {
                    /* ignore */
                }
            }
        }
    }

    private persistMatchEnd(params: {
        matchStatus: 'completed' | 'aborted';
        reason: string;
        standardWinner?: 'attacker' | 'defender';
        deathmatchWinnerPlayerIds?: string[];
    }): void {
        const matchId = this.matchId;
        const ticks = this.gameWorld?.getTick() ?? 0;
        const events = [...this.replayEvents];
        const actions = replayRepo.replayEventsToActionRows(events);
        const startMeta = this.replayStartMeta;
        const rawStats: PlayerMatchStats[] = this.gameWorld?.getPlayerStatsList() ?? [];
        const playersSnapshot = [...this.players.values()].map((p) => ({
            playerId: p.id,
            userId: p.userId,
            displayName: p.displayName && p.displayName.trim() ? p.displayName.trim() : null
        }));
        this.replayEvents = [];
        this.replayStartMeta = null;
        this.matchId = null;
        if (!matchId) {
            return;
        }
        const pool = getPool();
        if (!pool) {
            return;
        }
        void (async () => {
            try {
                const displayByPlayerId = new Map(playersSnapshot.map((p) => [p.playerId, p.displayName]));
                const userByPlayerId = new Map(playersSnapshot.map((p) => [p.playerId, p.userId]));
                const matchStats: PlayerMatchStats[] = rawStats.map((row) => ({
                    ...row,
                    displayName: displayByPlayerId.get(row.playerId) ?? row.displayName ?? null
                }));
                const winnerUserIds =
                    params.deathmatchWinnerPlayerIds && params.deathmatchWinnerPlayerIds.length > 0
                        ? params.deathmatchWinnerPlayerIds
                              .map((pid) => userByPlayerId.get(pid))
                              .filter((id): id is string => Boolean(id))
                        : null;
                await matchRepo.finalizeMatch(pool, {
                    matchId,
                    status: params.matchStatus,
                    winnerRole: params.standardWinner ?? null,
                    winnerUserIds,
                    endReason: params.reason,
                    durationTicks: ticks,
                    matchStats
                });
                if (startMeta) {
                    await replayRepo.saveMatchReplayActions(pool, matchId, {
                        startMeta,
                        actions,
                        durationTicks: ticks,
                        events
                    });
                }
                await replayRepo.createReplaysForParticipants(pool, matchId);
            } catch (err) {
                console.error(`[ROOM ${this.code}] Failed to record match end / replay:`, err);
            }
        })();
    }

    private sendJoinedState(ws: WebSocket, player: Player): void {
        ws.send(JSON.stringify({
            type: 'joined',
            roomId: this.code,
            playerId: player.id,
            role: player.role
        }));
        if (this.gameWorld) {
            ws.send(JSON.stringify({ type: 'gameStart' }));
            ws.send(
                JSON.stringify({
                    type: 'snapshot',
                    tick: this.gameWorld.getTick(),
                    world: this.gameWorld.getSnapshot()
                })
            );
        }
    }

    private endGame(result: GameWorldEndResult): void {
        this.simulationStarting = false;
        if (this.gameLoopInterval) {
            clearInterval(this.gameLoopInterval);
            this.gameLoopInterval = null;
        }

        if (result.mode === 'standard') {
            this.persistMatchEnd({
                matchStatus: 'completed',
                reason: result.reason,
                standardWinner: result.winner
            });
        } else {
            this.persistMatchEnd({
                matchStatus: 'completed',
                reason: result.reason,
                deathmatchWinnerPlayerIds: result.winnerPlayerIds
            });
        }

        for (const player of this.players.values()) {
            if (player.ws && player.ws.readyState === WebSocket.OPEN) {
                if (result.mode === 'standard') {
                    player.ws.send(
                        JSON.stringify({
                            type: 'gameEnd',
                            winner: result.winner,
                            reason: result.reason,
                            stats: result.stats
                        })
                    );
                } else {
                    player.ws.send(
                        JSON.stringify({
                            type: 'gameEnd',
                            deathmatch: true,
                            reason: result.reason,
                            winnerPlayerIds: result.winnerPlayerIds,
                            scores: result.scores,
                            stats: result.stats
                        })
                    );
                }
            }
        }
        for (const sp of this.spectators.values()) {
            if (sp.ws.readyState !== WebSocket.OPEN) continue;
            try {
                if (result.mode === 'standard') {
                    sp.ws.send(
                        JSON.stringify({
                            type: 'gameEnd',
                            winner: result.winner,
                            reason: result.reason,
                            stats: result.stats
                        })
                    );
                } else {
                    sp.ws.send(
                        JSON.stringify({
                            type: 'gameEnd',
                            deathmatch: true,
                            reason: result.reason,
                            winnerPlayerIds: result.winnerPlayerIds,
                            scores: result.scores,
                            stats: result.stats
                        })
                    );
                }
            } catch {
                /* ignore */
            }
        }

        if (this.gameWorld) {
            this.gameWorld.setReplayEventSink(null);
        }
        this.gameWorld = null;
    }

    isEmpty(): boolean {
        for (const player of this.players.values()) {
            if (player.ws) {
                return false;
            }
        }
        return true;
    }

    /** Идёт тиковый цикл матча (для реконнекта и списка «Смотреть»). */
    hasActiveGame(): boolean {
        return this.gameWorld !== null && this.gameLoopInterval !== null;
    }

    hasUser(userId: string): boolean {
        for (const player of this.players.values()) {
            if (player.userId === userId) {
                return true;
            }
        }
        return false;
    }

    forceCloseDueToEmpty(): void {
        this.simulationStarting = false;
        if (this.gameLoopInterval) {
            clearInterval(this.gameLoopInterval);
            this.gameLoopInterval = null;
        }
        if (this.gameWorld) {
            this.gameWorld.setReplayEventSink(null);
            this.gameWorld = null;
        }
        this.replayEvents = [];
        this.replayStartMeta = null;
        this.matchId = null;
    }
}

