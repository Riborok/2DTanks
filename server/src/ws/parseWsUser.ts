import type { IncomingMessage } from 'http';
import { payloadToWsUser, verifyAccessToken } from '../auth/jwt';
import type { WsAuthUser } from '../auth/types';

export function parseWsUserFromRequest(req: IncomingMessage): WsAuthUser | null {
    try {
        const host = 'localhost';
        const url = new URL(req.url || '/', `http://${host}`);
        const token = url.searchParams.get('token');
        if (!token) {
            return null;
        }
        const payload = verifyAccessToken(token);
        return payloadToWsUser(payload);
    } catch {
        return null;
    }
}
