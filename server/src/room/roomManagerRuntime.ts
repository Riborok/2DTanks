import type { RoomManager } from './RoomManager';

let roomManagerRef: RoomManager | null = null;

export function setRoomManager(roomManager: RoomManager): void {
    roomManagerRef = roomManager;
}

export function getRoomManager(): RoomManager | null {
    return roomManagerRef;
}
