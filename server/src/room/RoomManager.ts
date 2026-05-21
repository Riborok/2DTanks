import { WebSocket } from 'ws';
import { Room, type RoomCreateOptions } from './Room';
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
        if (auth?.userId) {
            this.leaveUserRooms(auth.userId);
        }

        let code: string;
        do {
            code = RoomCodeGenerator.generate();
        } while (this.rooms.has(code));

        const roomOptions: RoomCreateOptions = {
            singlePlayerTest,
            practiceMode,
            deathmatchMode
        };
        const room = new Room(code, roomOptions);
        const playerId = room.addPlayer(null, auth);
        this.rooms.set(code, room);

        return { code, playerId };
    }

    joinRoom(code: string, ws: WebSocket, auth: WsAuthUser | null = null): { playerId: string } | null {
        const room = this.rooms.get(code);
        if (!room) {
            return null;
        }

        if (auth?.userId) {
            this.leaveUserRooms(auth.userId, code);
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
        // 2) Lobby/tank-selection rooms also must reattach instead of creating duplicates.
        for (const [code, room] of this.rooms.entries()) {
            if (room.hasActiveGame() || !room.hasUser(auth.userId)) {
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

    isPlayerCurrentSocket(roomCode: string, playerId: string, ws: WebSocket): boolean {
        const room = this.rooms.get(roomCode);
        return room?.isPlayerCurrentSocket(playerId, ws) === true;
    }

    handleDisconnect(roomCode: string, playerId: string, ws?: WebSocket): void {
        const room = this.rooms.get(roomCode);
        if (room) {
            room.handleDisconnect(playerId, ws);
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

    leaveUserRooms(userId: string, exceptCode?: string): void {
        for (const [code, room] of this.rooms.entries()) {
            if (exceptCode && code === exceptCode) {
                continue;
            }
            if (!room.hasUser(userId)) {
                continue;
            }
            room.leaveUser(userId);
            if (room.isEmpty()) {
                this.rooms.delete(code);
            }
        }
    }

    getRoom(code: string): Room | undefined {
        return this.rooms.get(code);
    }

    getUserRoomSummary(userId: string):
        | {
              code: string;
              playerCount: number;
              spectatorCount: number;
              hasActiveGame: boolean;
              singlePlayerTest: boolean;
              practiceMode: boolean;
              deathmatchMode: boolean;
          }
        | null {
        for (const [code, room] of this.rooms.entries()) {
            if (!room.hasUser(userId)) {
                continue;
            }
            const info = room.getPublicInfo();
            return {
                code,
                playerCount: info.playerCount,
                spectatorCount: info.spectatorCount,
                hasActiveGame: info.hasActiveGame,
                singlePlayerTest: info.singlePlayerTest,
                practiceMode: info.practiceMode,
                deathmatchMode: info.deathmatchMode
            };
        }
        return null;
    }

    /**
     * Список активных комнат (с идущей игрой) для страницы «Смотреть матч».
     * Возвращаем только то, что не помечено как singlePlayerTest, и где реально
     * есть игроки — наблюдать в пустой тестовой комнате смысла нет.
     */
    listWatchableRooms(): Array<{
        code: string;
        playerCount: number;
        spectatorCount: number;
        hasActiveGame: boolean;
        practiceMode: boolean;
        deathmatchMode: boolean;
    }> {
        const out: Array<{
            code: string;
            playerCount: number;
            spectatorCount: number;
            hasActiveGame: boolean;
            practiceMode: boolean;
            deathmatchMode: boolean;
        }> = [];
        for (const [code, room] of this.rooms.entries()) {
            const info = room.getPublicInfo();
            if (info.singlePlayerTest) continue;
            if (info.playerCount === 0) continue;
            out.push({
                code,
                playerCount: info.playerCount,
                spectatorCount: info.spectatorCount,
                hasActiveGame: info.hasActiveGame,
                practiceMode: info.practiceMode,
                deathmatchMode: info.deathmatchMode
            });
        }
        return out;
    }

    spectateRoom(
        code: string,
        ws: WebSocket,
        auth: WsAuthUser | null = null
    ): { spectatorId: string; code: string } | null {
        const room = this.rooms.get(code);
        if (!room) return null;
        const added = room.addSpectator(ws, auth);
        if (!added) return null;
        return { spectatorId: added.spectatorId, code };
    }

    handleSpectatorDisconnect(code: string, spectatorId: string): void {
        const room = this.rooms.get(code);
        if (!room) return;
        room.removeSpectator(spectatorId);
    }
}
