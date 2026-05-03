import { WebSocket } from 'ws';

describe('userSocketRegistry', () => {
    beforeEach(() => {
        jest.resetModules();
    });

    it('registerUserSocket + notifyUserSockets sends JSON when OPEN', async () => {
        const { registerUserSocket, notifyUserSockets, unregisterUserSocket } = await import(
            '../../src/ws/userSocketRegistry'
        );
        const send = jest.fn();
        const sock = { readyState: WebSocket.OPEN, send } as unknown as WebSocket;
        registerUserSocket('user-a', sock);
        notifyUserSockets('user-a', { kind: 'ping', n: 1 });
        expect(send).toHaveBeenCalledWith(JSON.stringify({ kind: 'ping', n: 1 }));
        unregisterUserSocket('user-a', sock);
    });

    it('notifyUserSockets does not send when socket is not OPEN', async () => {
        const { registerUserSocket, notifyUserSockets, unregisterUserSocket } = await import(
            '../../src/ws/userSocketRegistry'
        );
        const send = jest.fn();
        const sock = { readyState: WebSocket.CLOSED, send } as unknown as WebSocket;
        registerUserSocket('user-b', sock);
        notifyUserSockets('user-b', { x: 1 });
        expect(send).not.toHaveBeenCalled();
        unregisterUserSocket('user-b', sock);
    });

    it('unregisterUserSocket removes empty user bucket', async () => {
        const { registerUserSocket, unregisterUserSocket, notifyUserSockets } = await import(
            '../../src/ws/userSocketRegistry'
        );
        const send = jest.fn();
        const sock = { readyState: WebSocket.OPEN, send } as unknown as WebSocket;
        registerUserSocket('user-c', sock);
        unregisterUserSocket('user-c', sock);
        notifyUserSockets('user-c', { after: true });
        expect(send).not.toHaveBeenCalled();
    });

    it('notifyUserSockets swallows send errors', async () => {
        const { registerUserSocket, notifyUserSockets } = await import('../../src/ws/userSocketRegistry');
        const sock = {
            readyState: WebSocket.OPEN,
            send: () => {
                throw new Error('broken transport');
            }
        } as unknown as WebSocket;
        registerUserSocket('user-d', sock);
        expect(() => notifyUserSockets('user-d', { ok: true })).not.toThrow();
    });

    it('registerUserSocket adds multiple sockets per user', async () => {
        const { registerUserSocket, notifyUserSockets, unregisterUserSocket } = await import(
            '../../src/ws/userSocketRegistry'
        );
        const s1 = jest.fn();
        const s2 = jest.fn();
        const sock1 = { readyState: WebSocket.OPEN, send: s1 } as unknown as WebSocket;
        const sock2 = { readyState: WebSocket.OPEN, send: s2 } as unknown as WebSocket;
        registerUserSocket('user-e', sock1);
        registerUserSocket('user-e', sock2);
        notifyUserSockets('user-e', { m: 2 });
        expect(s1).toHaveBeenCalled();
        expect(s2).toHaveBeenCalled();
        unregisterUserSocket('user-e', sock1);
        unregisterUserSocket('user-e', sock2);
    });
});
