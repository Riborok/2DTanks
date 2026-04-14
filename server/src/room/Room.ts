import { WebSocket } from 'ws';
import { GameWorld } from '../game/world/GameWorld';
import { TankConfig } from '../utils/types';
import type { WsAuthUser } from '../auth/types';
import { getPool } from '../db/pool';
import * as matchRepo from '../repos/matchRepo';
import * as replayRepo from '../repos/replayRepo';
import { getRandomInt } from '../utils/additionalFunc';
import type { GameWorldEndResult } from '../game/world/gameWorldEndResult';

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
    private currentDeltaTime: number = 16.67; // Default to ~60Hz
    private readonly TICK_RATE = 60; // 60 Hz
    private readonly TICK_INTERVAL = 1000 / this.TICK_RATE;
    private readonly singlePlayerTest: boolean;
    /** Два игрока: не пишем матч в БД, без лимита времени в мире. */
    private readonly practiceMode: boolean;
    /** FFA 2–5 игроков, 60 с, киллы. */
    private readonly deathmatchMode: boolean;
    private readonly maxPlayers: number;
    private matchId: string | null = null;
    /** Действия для action-based реплея (сохраняются в match_replay_actions). */
    private replayActions: replayRepo.ReplayActionEvent[] = [];
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
        this.replayActions = [];
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
            this.gameWorld = new GameWorld(cfg0, cfg0, this.code, false, false, {
                surfaceMaterial: surface,
                fighters
            });
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

        const pool = getPool();
        if (pool && !this.singlePlayerTest && !this.practiceMode && !this.deathmatchMode) {
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
            try {
                this.matchId = await matchRepo.createMatchWithParticipants(pool, {
                    roomCode: this.code,
                    players: participants
                });
                if (this.matchId) {
                    console.log(`[ROOM ${this.code}] Match persisted: ${this.matchId}`);
                }
            } catch (err) {
                console.error(`[ROOM ${this.code}] Failed to record match start:`, err);
            }
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

        // Start game loop (similar to original GameLoop.gameLoop)
        this.lastGameLoopTime = Date.now();
        this.gameLoopInterval = setInterval(() => {
            const currentTime = Date.now();
            const deltaTime = currentTime - this.lastGameLoopTime;
            this.lastGameLoopTime = currentTime;
            
            // Store current deltaTime for use in handlePlayerAction
            // Cap deltaTime to prevent huge jumps (similar to original)
            this.currentDeltaTime = Math.min(deltaTime, 100); // Cap at 100ms

            if (this.gameWorld) {
                this.gameWorld.update(this.currentDeltaTime);
                this.broadcastSnapshot();

                // Check game end conditions
                const gameEnd = this.gameWorld.checkGameEnd();
                if (gameEnd) {
                    this.endGame(gameEnd);
                }
            }
        }, this.TICK_INTERVAL);
    }

    handlePlayerAction(playerId: string, action: any): void {
        if (this.gameWorld) {
            if (
                this.matchId &&
                this.replayStartMeta &&
                this.replayActions.length < Room.REPLAY_MAX_ACTIONS
            ) {
                this.replayActions.push({
                    tick: this.gameWorld.getTick(),
                    playerId,
                    action
                });
            }
            // Use actual deltaTime from game loop (similar to original GameLoop)
            // This ensures actions are processed with the same time scale as game updates
            this.gameWorld.handlePlayerAction(playerId, action, this.currentDeltaTime);
        }
    }

    handleDisconnect(playerId: string): void {
        const player = this.players.get(playerId);
        if (player && player.ws) {
            player.ws = null;
        }

        if (this.gameWorld && this.deathmatchMode) {
            const scores = this.gameWorld.getDeathmatchScoreList();
            for (const p of this.players.values()) {
                if (p.id !== playerId && p.ws && p.ws.readyState === WebSocket.OPEN) {
                    p.ws.send(
                        JSON.stringify({
                            type: 'gameEnd',
                            deathmatch: true,
                            reason: 'playerDisconnected',
                            winnerPlayerIds: [],
                            scores
                        })
                    );
                }
            }
            if (this.gameLoopInterval) {
                clearInterval(this.gameLoopInterval);
                this.gameLoopInterval = null;
            }
            this.gameWorld = null;
            return;
        }

        let winnerOnDisconnect: 'attacker' | 'defender' | null = null;
        if (this.gameWorld && !this.singlePlayerTest) {
            for (const p of this.players.values()) {
                if (p.id !== playerId && (p.role === 'attacker' || p.role === 'defender')) {
                    winnerOnDisconnect = p.role;
                    break;
                }
            }
        }

        // Notify other player
        for (const p of this.players.values()) {
            if (p.id !== playerId && p.ws) {
                const payload: { type: string; reason: string; winner?: 'attacker' | 'defender' } = {
                    type: 'gameEnd',
                    reason: 'opponentDisconnected'
                };
                if (winnerOnDisconnect) {
                    payload.winner = winnerOnDisconnect;
                }
                p.ws.send(JSON.stringify(payload));
            }
        }

        // Stop game
        if (this.gameLoopInterval) {
            clearInterval(this.gameLoopInterval);
            this.gameLoopInterval = null;
        }

        if (this.gameWorld && winnerOnDisconnect) {
            this.persistMatchEnd({
                matchStatus: 'aborted',
                winner: winnerOnDisconnect,
                reason: 'opponentDisconnect'
            });
        }

        this.gameWorld = null;
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
        winner: 'attacker' | 'defender';
        reason: string;
    }): void {
        const matchId = this.matchId;
        const ticks = this.gameWorld?.getTick() ?? 0;
        const actions = [...this.replayActions];
        const startMeta = this.replayStartMeta;
        this.replayActions = [];
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
                await matchRepo.finalizeMatch(pool, {
                    matchId,
                    status: params.matchStatus,
                    winnerRole: params.winner,
                    endReason: params.reason,
                    durationTicks: ticks
                });
                if (startMeta) {
                    await replayRepo.saveMatchReplayActions(pool, matchId, {
                        startMeta,
                        actions,
                        durationTicks: ticks
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
                winner: result.winner,
                reason: result.reason
            });
        }

        for (const player of this.players.values()) {
            if (player.ws && player.ws.readyState === WebSocket.OPEN) {
                if (result.mode === 'standard') {
                    player.ws.send(
                        JSON.stringify({
                            type: 'gameEnd',
                            winner: result.winner,
                            reason: result.reason
                        })
                    );
                } else {
                    player.ws.send(
                        JSON.stringify({
                            type: 'gameEnd',
                            deathmatch: true,
                            reason: result.reason,
                            winnerPlayerIds: result.winnerPlayerIds,
                            scores: result.scores
                        })
                    );
                }
            }
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
}

