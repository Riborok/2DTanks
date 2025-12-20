import { WebSocket } from 'ws';
import { GameWorld } from '../game/world/GameWorld';
import { TankConfig } from '../utils/types';

type PlayerRole = 'attacker' | 'defender';

interface Player {
    id: string;
    ws: WebSocket | null;
    role: PlayerRole | null;
    tankConfig: TankConfig | null;
    ready: boolean;
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

    constructor(code: string) {
        this.code = code;
    }

    addPlayer(ws: WebSocket | null): string | null {
        if (this.players.size >= 2) {
            return null; // Room is full
        }

        const playerId = `player_${Date.now()}_${Math.random()}`;
        const role: PlayerRole = this.players.size === 0 ? 'attacker' : 'defender';

        const player: Player = {
            id: playerId,
            ws,
            role,
            tankConfig: null,
            ready: false
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
            console.log(`[ROOM ${this.code}] Player ${playerId} joined as ${role} (total: ${this.players.size}/2)`);
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

    setTankConfig(playerId: string, config: TankConfig): void {
        const player = this.players.get(playerId);
        if (player) {
            player.tankConfig = config;
            console.log(`[ROOM ${this.code}] Player ${playerId} (${player.role}) selected tank config`);
            this.broadcastRoomUpdate();
        }
    }

    setReady(playerId: string, ready: boolean): void {
        const player = this.players.get(playerId);
        if (player) {
            player.ready = ready;
            console.log(`[ROOM ${this.code}] Player ${playerId} (${player.role}) ready status: ${ready}`);
            this.broadcastRoomUpdate();

            // Check if both players are ready
            if (ready && this.areAllPlayersReady()) {
                console.log(`[ROOM ${this.code}] All players ready - starting game!`);
                this.startGame();
            }
        }
    }

    private areAllPlayersReady(): boolean {
        if (this.players.size < 2) return false;

        for (const player of this.players.values()) {
            if (!player.tankConfig || !player.ready) {
                return false;
            }
        }

        return true;
    }

    private startGame(): void {
        const playersArray = Array.from(this.players.values());
        const attacker = playersArray.find(p => p.role === 'attacker');
        const defender = playersArray.find(p => p.role === 'defender');

        if (!attacker || !defender || !attacker.tankConfig || !defender.tankConfig) {
            console.log(`[ROOM ${this.code}] Cannot start game - missing players or configs`);
            return;
        }

        console.log(`[ROOM ${this.code}] Starting game for attacker ${attacker.id} and defender ${defender.id}`);

        // Initialize game world
        this.gameWorld = new GameWorld(attacker.tankConfig, defender.tankConfig, this.code);
        
        // Set player tank mappings
        this.gameWorld.setPlayerTankMapping(attacker.id, defender.id);

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

        // Notify other player
        for (const p of this.players.values()) {
            if (p.id !== playerId && p.ws) {
                p.ws.send(JSON.stringify({
                    type: 'gameEnd',
                    reason: 'opponentDisconnected'
                }));
            }
        }

        // Stop game
        if (this.gameLoopInterval) {
            clearInterval(this.gameLoopInterval);
            this.gameLoopInterval = null;
        }
        this.gameWorld = null;
    }

    private broadcastRoomUpdate(): void {
        const playersArray = Array.from(this.players.values()).map(player => ({
            playerId: player.id,
            role: player.role,
            tankConfig: player.tankConfig,
            ready: player.ready
        }));

        const statusSummary = playersArray.map(p => 
            `${p.role} (${p.tankConfig ? 'tank selected' : 'selecting tank'}, ${p.ready ? 'ready' : 'not ready'})`
        ).join(', ');
        console.log(`[ROOM ${this.code}] Broadcasting update: ${statusSummary}`);

        for (const player of this.players.values()) {
            if (player.ws && player.ws.readyState === WebSocket.OPEN) {
                player.ws.send(JSON.stringify({
                    type: 'roomUpdate',
                    players: playersArray
                }));
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

    private endGame(result: { winner: 'attacker' | 'defender'; reason: string }): void {
        if (this.gameLoopInterval) {
            clearInterval(this.gameLoopInterval);
            this.gameLoopInterval = null;
        }

        for (const player of this.players.values()) {
            if (player.ws && player.ws.readyState === WebSocket.OPEN) {
                player.ws.send(JSON.stringify({
                    type: 'gameEnd',
                    winner: result.winner,
                    reason: result.reason
                }));
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

