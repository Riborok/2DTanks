import { WebSocket } from 'ws';

/**
 * Реестр открытых игровых WebSocket по userId.
 * Используется и HTTP-роутами (push после действий в БД), и wss-сервером.
 */
const socketsByUserId = new Map<string, Set<WebSocket>>();

export function registerUserSocket(userId: string, socket: WebSocket): void {
    let set = socketsByUserId.get(userId);
    if (!set) {
        set = new Set();
        socketsByUserId.set(userId, set);
    }
    set.add(socket);
}

export function unregisterUserSocket(userId: string, socket: WebSocket): void {
    const set = socketsByUserId.get(userId);
    if (!set) return;
    set.delete(socket);
    if (set.size === 0) {
        socketsByUserId.delete(userId);
    }
}

export function notifyUserSockets(userId: string, payload: Record<string, unknown>): void {
    const set = socketsByUserId.get(userId);
    if (!set || set.size === 0) return;
    const raw = JSON.stringify(payload);
    for (const s of set) {
        if (s.readyState === WebSocket.OPEN) {
            try {
                s.send(raw);
            } catch {
                /* ignore */
            }
        }
    }
}
