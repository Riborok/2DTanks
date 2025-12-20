import { WebSocket } from 'ws';
import { Room } from './Room';
import { RoomCodeGenerator } from '../utils/roomCodeGenerator';

export class RoomManager {
    private rooms: Map<string, Room> = new Map();

    createRoom(): { code: string; playerId: string } {
        let code: string;
        do {
            code = RoomCodeGenerator.generate();
        } while (this.rooms.has(code));

        const room = new Room(code);
        const playerId = room.addPlayer(null); // First player, no WebSocket yet
        this.rooms.set(code, room);

        return { code, playerId };
    }

    joinRoom(code: string, ws: WebSocket): { playerId: string } | null {
        const room = this.rooms.get(code);
        if (!room) {
            return null;
        }

        const result = room.addPlayer(ws);
        if (!result) {
            return null;
        }

        return { playerId: result };
    }

    setTankConfig(roomCode: string, playerId: string, config: any): void {
        const room = this.rooms.get(roomCode);
        if (room) {
            room.setTankConfig(playerId, config);
        }
    }

    setReady(roomCode: string, playerId: string, ready: boolean): void {
        const room = this.rooms.get(roomCode);
        if (room) {
            room.setReady(playerId, ready);
        }
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
                        this.rooms.delete(roomCode);
                    }
                }, 30000);
            }
        }
    }

    getRoom(code: string): Room | undefined {
        return this.rooms.get(code);
    }
}
