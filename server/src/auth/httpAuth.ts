import type { Request, Response, NextFunction } from 'express';
import type { AccessTokenPayload } from './jwt';
import { verifyAccessToken } from './jwt';

declare module 'express-serve-static-core' {
    interface Request {
        auth?: AccessTokenPayload;
    }
}

export function requireBearerAuth(req: Request, res: Response, next: NextFunction): void {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!token) {
        res.status(401).json({ error: 'Нет токена' });
        return;
    }
    try {
        req.auth = verifyAccessToken(token);
        next();
    } catch {
        res.status(401).json({ error: 'Недействительный токен' });
    }
}
