import { WebSocket } from 'ws';
import { Room } from './Room';
import { RoomCodeGenerator } from '../utils/roomCodeGenerator';
import type { WsAuthUser } from '../auth/types';

export class RoomManager {
    private rooms: Map<string, Room> = new Map();

    createRoom(
        singlePlayerTest = false,
        auth: WsAuthUser | null = null,
        practiceMode = false,
        deathmatchMode = false
    ): { code: string; playerId: string } {
        let code: string;
        do {
            code = RoomCodeGenerator.generate();
        } while (this.rooms.has(code));

        const room = new Room(code, { singlePlayerTest, practiceMode, deathmatchMode });
        const playerId = room.addPlayer(null, auth);
        this.rooms.set(code, room);

        return { code, playerId };
    }

    joinRoom(code: string, ws: WebSocket, auth: WsAuthUser | null = null): { playerId: string } | null {
        const room = this.rooms.get(code);
        if (!room) {
            return null;
        }

        const result = room.addPlayer(ws, auth);
        if (!result) {
            return null;
        }

        return { playerId: result };
    }

    reconnectByUser(ws: WebSocket, auth: WsAuthUser): { code: string; playerId: string } | null {
        // 1) Priority: active in-game room for exact user.
        for (const [code, room] of this.rooms.entries()) {
            if (!room.hasActiveGame() || !room.hasUser(auth.userId)) {
                continue;
            }
            const restored = room.reconnectPlayerByUserId(ws, auth);
            if (restored) {
                return { code, playerId: restored.playerId };
            }
        }
        return null;
    }

    setTankConfig(roomCode: string, playerId: string, config: any): { success: boolean; message?: string } {
        const room = this.rooms.get(roomCode);
        if (room) {
            return room.setTankConfig(playerId, config);
        }
        return { success: false, message: 'Room not found' };
    }

    setReady(roomCode: string, playerId: string, ready: boolean): { success: boolean; message?: string } {
        const room = this.rooms.get(roomCode);
        if (room) {
            return room.setReady(playerId, ready);
        }
        return { success: false, message: 'Room not found' };
    }

    handlePlayerAction(roomCode: string, playerId: string, action: any): void {
        const room = this.rooms.get(roomCode);
        if (room) {
            room.handlePlayerAction(playerId, action);
        }
    }

    handleDisconnect(roomCode: string, playerId: string): void {
        const room = this.rooms.get(roomCode);
        if (room) {
            room.handleDisconnect(playerId);
            if (room.isEmpty()) {
                // Clean up empty room after delay
                setTimeout(() => {
                    if (room.isEmpty()) {
                        room.forceCloseDueToEmpty();
                        this.rooms.delete(roomCode);
                    }
                }, 30000);
            }
        }
    }

    leaveRoom(roomCode: string, playerId: string): void {
        const room = this.rooms.get(roomCode);
        if (!room) {
            return;
        }
        room.leavePlayer(playerId);
        if (room.isEmpty()) {
            this.rooms.delete(roomCode);
        }
    }

    getRoom(code: string): Room | undefined {
        return this.rooms.get(code);
    }
}
