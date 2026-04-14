import { Router, type Request, type Response } from 'express';
import { getPool } from '../db/pool';
import { hashPassword, verifyPassword } from '../auth/password';
import { signAccessToken, verifyAccessToken } from '../auth/jwt';
import * as userRepo from '../repos/userRepo';

const router = Router();

function badRequest(res: Response, message: string) {
    res.status(400).json({ error: message });
}

function jwtReady(res: Response): boolean {
    if (!process.env.JWT_SECRET?.trim()) {
        res.status(503).json({ error: 'JWT_SECRET не задан в окружении сервера' });
        return false;
    }
    return true;
}

function emailOk(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

router.post('/register', async (req: Request, res: Response) => {
    const pool = getPool();
    if (!pool) {
        res.status(503).json({ error: 'База данных не настроена (DATABASE_URL)' });
        return;
    }

    const login = String(req.body?.login ?? '').trim();
    const email = String(req.body?.email ?? '').trim();
    const password = String(req.body?.password ?? '');
    const displayName = String(req.body?.displayName ?? '').trim();

    if (login.length < 3 || login.length > 50) {
        badRequest(res, 'Логин: от 3 до 50 символов');
        return;
    }
    if (!emailOk(email) || email.length > 255) {
        badRequest(res, 'Некорректный email');
        return;
    }
    if (password.length < 8) {
        badRequest(res, 'Пароль не короче 8 символов');
        return;
    }
    if (displayName.length < 1 || displayName.length > 100) {
        badRequest(res, 'Имя: от 1 до 100 символов');
        return;
    }

    if (!jwtReady(res)) {
        return;
    }

    try {
        if (await userRepo.findUserByLogin(pool, login)) {
            res.status(409).json({ error: 'Логин уже занят' });
            return;
        }
        if (await userRepo.findUserByEmail(pool, email)) {
            res.status(409).json({ error: 'Email уже зарегистрирован' });
            return;
        }

        const passwordHash = await hashPassword(password);
        const user = await userRepo.createUser(pool, {
            login,
            email,
            passwordHash,
            displayName
        });
        const profile = await userRepo.getProfileByUserId(pool, user.user_id);

        const token = signAccessToken({
            sub: user.user_id,
            login: user.login,
            displayName: user.display_name
        });

        res.status(201).json({
            token,
            user: {
                userId: user.user_id,
                login: user.login,
                email: user.email,
                displayName: user.display_name,
                createdAt: user.created_at
            },
            profile: profile
                ? {
                      avatarUrl: profile.avatar_url,
                      preferredRole: profile.preferred_role
                  }
                : null
        });
    } catch (e) {
        console.error('[auth/register]', e);
        res.status(500).json({ error: 'Ошибка регистрации' });
    }
});

router.post('/login', async (req: Request, res: Response) => {
    const pool = getPool();
    if (!pool) {
        res.status(503).json({ error: 'База данных не настроена (DATABASE_URL)' });
        return;
    }

    const login = String(req.body?.login ?? '').trim();
    const password = String(req.body?.password ?? '');

    if (!login || !password) {
        badRequest(res, 'Укажите логин и пароль');
        return;
    }

    if (!jwtReady(res)) {
        return;
    }

    try {
        const user = await userRepo.findUserByLogin(pool, login);
        if (!user || !(await verifyPassword(password, user.password_hash))) {
            res.status(401).json({ error: 'Неверный логин или пароль' });
            return;
        }

        const profile = await userRepo.getProfileByUserId(pool, user.user_id);
        const token = signAccessToken({
            sub: user.user_id,
            login: user.login,
            displayName: user.display_name
        });

        res.json({
            token,
            user: {
                userId: user.user_id,
                login: user.login,
                email: user.email,
                displayName: user.display_name,
                createdAt: user.created_at
            },
            profile: profile
                ? {
                      avatarUrl: profile.avatar_url,
                      preferredRole: profile.preferred_role
                  }
                : null
        });
    } catch (e) {
        console.error('[auth/login]', e);
        res.status(500).json({ error: 'Ошибка входа' });
    }
});

router.put('/profile', async (req: Request, res: Response) => {
    const pool = getPool();
    if (!pool) {
        res.status(503).json({ error: 'База данных не настроена (DATABASE_URL)' });
        return;
    }

    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!token) {
        res.status(401).json({ error: 'Нет токена' });
        return;
    }

    let sub: string;
    try {
        sub = verifyAccessToken(token).sub;
    } catch {
        res.status(401).json({ error: 'Недействительный токен' });
        return;
    }

    const avatarUrlRaw = req.body?.avatarUrl;
    const preferredRoleRaw = req.body?.preferredRole;
    const updates: { avatarUrl?: string | null; preferredRole?: 'attacker' | 'defender' | null } = {};

    if (avatarUrlRaw !== undefined) {
        if (avatarUrlRaw === null || avatarUrlRaw === '') {
            updates.avatarUrl = null;
        } else {
            const u = String(avatarUrlRaw).trim();
            if (u.length > 500) {
                badRequest(res, 'URL аватара не длиннее 500 символов');
                return;
            }
            updates.avatarUrl = u;
        }
    }

    if (preferredRoleRaw !== undefined) {
        if (preferredRoleRaw === null || preferredRoleRaw === '') {
            updates.preferredRole = null;
        } else if (preferredRoleRaw === 'attacker' || preferredRoleRaw === 'defender') {
            updates.preferredRole = preferredRoleRaw;
        } else {
            badRequest(res, 'preferredRole: attacker или defender');
            return;
        }
    }

    if (Object.keys(updates).length === 0) {
        badRequest(res, 'Укажите avatarUrl и/или preferredRole');
        return;
    }

    try {
        const changed = await userRepo.updateUserProfile(pool, sub, updates);
        if (!changed) {
            res.status(404).json({ error: 'Профиль не найден' });
            return;
        }
        const profile = await userRepo.getProfileByUserId(pool, sub);
        res.json({
            profile: profile
                ? {
                      avatarUrl: profile.avatar_url,
                      preferredRole: profile.preferred_role
                  }
                : null
        });
    } catch (e) {
        console.error('[auth/profile]', e);
        res.status(500).json({ error: 'Ошибка обновления профиля' });
    }
});

router.get('/me', async (req: Request, res: Response) => {
    const pool = getPool();
    if (!pool) {
        res.status(503).json({ error: 'База данных не настроена (DATABASE_URL)' });
        return;
    }

    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!token) {
        res.status(401).json({ error: 'Нет токена' });
        return;
    }

    try {
        let sub: string;
        try {
            sub = verifyAccessToken(token).sub;
        } catch {
            res.status(401).json({ error: 'Недействительный токен' });
            return;
        }

        const user = await userRepo.findUserById(pool, sub);
        if (!user) {
            res.status(401).json({ error: 'Пользователь не найден' });
            return;
        }

        const profile = await userRepo.getProfileByUserId(pool, user.user_id);
        res.json({
            user: {
                userId: user.user_id,
                login: user.login,
                email: user.email,
                displayName: user.display_name,
                createdAt: user.created_at
            },
            profile: profile
                ? {
                      avatarUrl: profile.avatar_url,
                      preferredRole: profile.preferred_role
                  }
                : null
        });
    } catch (e) {
        console.error('[auth/me]', e);
        res.status(500).json({ error: 'Ошибка запроса профиля' });
    }
});

export default router;
