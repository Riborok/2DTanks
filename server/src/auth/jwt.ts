import jwt from 'jsonwebtoken';
import type { WsAuthUser } from './types';

export interface AccessTokenPayload {
    sub: string;
    login: string;
    displayName: string;
}

const DEFAULT_TTL_SEC = 60 * 60 * 24 * 7;

function secret(): string {
    const s = process.env.JWT_SECRET?.trim();
    if (!s) {
        throw new Error('JWT_SECRET is not set');
    }
    return s;
}

export function signAccessToken(payload: AccessTokenPayload, expiresInSec = DEFAULT_TTL_SEC): string {
    return jwt.sign(
        { login: payload.login, displayName: payload.displayName },
        secret(),
        { subject: payload.sub, expiresIn: expiresInSec }
    );
}

export function verifyAccessToken(token: string): AccessTokenPayload {
    const decoded = jwt.verify(token, secret()) as jwt.JwtPayload;
    const sub = decoded.sub;
    const login = decoded.login as string | undefined;
    const displayName = decoded.displayName as string | undefined;
    if (!sub || !login || !displayName) {
        throw new Error('Invalid token payload');
    }
    return { sub, login, displayName };
}

export function payloadToWsUser(p: AccessTokenPayload): WsAuthUser {
    return { userId: p.sub, login: p.login, displayName: p.displayName };
}
