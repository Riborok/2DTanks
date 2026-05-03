import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import gameApiRoutes from './routes/gameApiRoutes';
import publicReplayRoutes from './routes/publicReplayRoutes';

/** Разрешённые Origin для CORS (браузерные запросы с другого хоста/порта). */
export function isAllowedCorsOrigin(origin: string | undefined): boolean {
    if (!origin) {
        return true;
    }
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) {
        return true;
    }
    if (/^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/i.test(origin)) {
        return true;
    }
    if (/^https?:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/i.test(origin)) {
        return true;
    }
    if (/^https?:\/\/172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}(:\d+)?$/i.test(origin)) {
        return true;
    }
    const extra = (process.env.CORS_ORIGINS ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    return extra.includes(origin);
}

/** HTTP-приложение без listen и без WebSocket — для Supertest и прод-сервера. */
export function createHttpApp(): express.Application {
    const app = express();
    app.use(
        cors({
            origin: (origin, cb) => {
                cb(null, isAllowedCorsOrigin(origin));
            },
            credentials: true
        })
    );
    app.use(express.json());
    app.use('/api/auth', authRoutes);
    app.use('/api/public', publicReplayRoutes);
    app.use('/api/game', gameApiRoutes);

    app.get('/api/health', (_req, res) => {
        res.json({ ok: true });
    });

    return app;
}
