import { WebSocket } from 'ws';
import { GameWorld } from '../game/world/GameWorld';
import { TankConfig } from '../utils/types';
import type { WsAuthUser } from '../auth/types';
import { getPool } from '../db/pool';
import * as matchRepo from '../repos/matchRepo';
import * as replayRepo from '../repos/replayRepo';
import { getRandomInt } from '../utils/additionalFunc';
import type { GameWorldEndResult, PlayerMatchStats } from '../game/world/gameWorldEndResult';

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

export class Room {
    private code: string;
    private players: Map<string, Player> = new Map();
    private gameWorld: GameWorld | null = null;
    private gameLoopInterval: NodeJS.Timeout | null = null;
    private lastGameLoopTime: number = 0;
    private readonly TICK_RATE = 60; // 60 Hz
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
    private static readonly REPLAY_MAX_ACTIONS = 20000;

    constructor(
        code: string,
        options?: { singlePlayerTest?: boolean; practiceMode?: boolean; deathmatchMode?: boolean }
    ) {
        this.code = code;
        this.singlePlayerTest = options?.singlePlayerTest === true;
        this.deathmatchMode = options?.deathmatchMode === true && !this.singlePlayerTest;
        this.practiceMode =
            options?.practiceMode === true && !this.singlePlayerTest && !this.deathmatchMode;
        if (this.singlePlayerTest) {
            this.maxPlayers = 1;
        } else if (this.deathmatchMode) {
            this.maxPlayers = 5;
        } else {
            this.maxPlayers = 2;
        }
    }

    addPlayer(ws: WebSocket | null, auth: WsAuthUser | null = null): string | null {
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
            ws.send(JSON.stringify({
                type: 'joined',
                roomId: this.code,
                playerId: playerId,
                role: role
            }));
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
                ws.send(
                    JSON.stringify({
                        type: 'joined',
                        roomId: this.code,
                        playerId: player.id,
                        role: player.role
                    })
                );
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

        // Notify all players that game is starting
        for (const player of this.players.values()) {
            if (player.ws && player.ws.readyState === WebSocket.OPEN) {
                player.ws.send(JSON.stringify({
                    type: 'gameStart'
                }));
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

    handleDisconnect(playerId: string): void {
        const player = this.players.get(playerId);
        if (player && player.ws) {
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

        for (const player of this.players.values()) {
            if (player.ws && player.ws.readyState === WebSocket.OPEN) {
                player.ws.send(
                    JSON.stringify({
                        type: 'roomUpdate',
                        players: playersArray,
                        singlePlayerTest: this.singlePlayerTest,
                        practiceMode: this.practiceMode,
                        deathmatchMode: this.deathmatchMode
                    })
                );
            }
        }
    }

    private broadcastSnapshot(): void {
        if (!this.gameWorld) return;

        const snapshot = this.gameWorld.getSnapshot();
        
        if (snapshot.bullets && snapshot.bullets.length > 0) {
            console.log(`[ROOM ${this.code}] broadcastSnapshot: sending ${snapshot.bullets.length} bullets to clients`);
        }

        for (const player of this.players.values()) {
            if (player.ws && player.ws.readyState === WebSocket.OPEN) {
                player.ws.send(JSON.stringify({
                    type: 'snapshot',
                    tick: this.gameWorld.getTick(),
                    world: snapshot
                }));
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
                const rawStats: PlayerMatchStats[] = this.gameWorld?.getPlayerStatsList() ?? [];
                const displayByPlayerId = new Map(
                    [...this.players.values()].map((p) => [
                        p.id,
                        p.displayName && p.displayName.trim() ? p.displayName.trim() : null
                    ])
                );
                const matchStats: PlayerMatchStats[] = rawStats.map((row) => ({
                    ...row,
                    displayName: displayByPlayerId.get(row.playerId) ?? row.displayName ?? null
                }));
                const winnerUserIds =
                    params.deathmatchWinnerPlayerIds && params.deathmatchWinnerPlayerIds.length > 0
                        ? params.deathmatchWinnerPlayerIds
                              .map((pid) => this.players.get(pid)?.userId)
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

    private endGame(result: GameWorldEndResult): void {
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

