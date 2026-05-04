import request from 'supertest';
import { createHttpApp } from '../../src/createHttpApp';
import { closePool } from '../../src/db/pool';

const app = createHttpApp();
const hasDb = Boolean(process.env.DATABASE_URL?.trim());

afterAll(async () => {
    await closePool();
});

describe('HTTP API (integration)', () => {
    it('GET /api/health returns ok', async () => {
        const res = await request(app).get('/api/health');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ ok: true });
    });
});

describe('Protected game API', () => {
    it('GET /api/game/replays without Authorization returns 401', async () => {
        await request(app).get('/api/game/replays').expect(401);
    });
});

(hasDb ? describe : describe.skip)('Auth API with PostgreSQL', () => {
    const suffix = () => `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    it('POST /api/auth/register creates user and returns token', async () => {
        const s = suffix();
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                login: `t_${s}`,
                email: `t_${s}@test.local`,
                password: 'password123',
                displayName: 'Test Player'
            });
        expect(res.status).toBe(201);
        expect(res.body.token).toBeTruthy();
        expect(res.body.user?.login).toBe(`t_${s}`);
    });

    it('POST /api/auth/login with valid credentials returns token', async () => {
        const s = suffix();
        const login = `login_${s}`;
        const password = 'password123';
        await request(app).post('/api/auth/register').send({
            login,
            email: `e_${s}@test.local`,
            password,
            displayName: 'Login Test'
        });
        const res = await request(app).post('/api/auth/login').send({ login, password });
        expect(res.status).toBe(200);
        expect(res.body.token).toBeTruthy();
        expect(res.body.user?.login).toBe(login);
    });

    it('POST /api/auth/login with wrong password returns 401', async () => {
        const s = suffix();
        const login = `wp_${s}`;
        await request(app)
            .post('/api/auth/register')
            .send({
                login,
                email: `wp_${s}@test.local`,
                password: 'correctpass123',
                displayName: 'WP'
            });
        const res = await request(app).post('/api/auth/login').send({
            login,
            password: 'wrongpassword999'
        });
        expect(res.status).toBe(401);
    });

    it('GET /api/game/replays with Bearer token returns 200', async () => {
        const s = suffix();
        const login = `game_${s}`;
        const reg = await request(app)
            .post('/api/auth/register')
            .send({
                login,
                email: `game_${s}@test.local`,
                password: 'password123',
                displayName: 'Game'
            });
        expect(reg.status).toBe(201);
        const token = reg.body.token as string;
        const res = await request(app).get('/api/game/replays').set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.replays)).toBe(true);
    });

    it('POST /api/auth/register rejects short password', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                login: `x_${suffix()}`,
                email: `x_${suffix()}@test.local`,
                password: 'short',
                displayName: 'X'
            });
        expect(res.status).toBe(400);
    });

    it('POST /api/auth/register rejects invalid email', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                login: `y_${suffix()}`,
                email: 'not-an-email',
                password: 'password123',
                displayName: 'Y'
            });
        expect(res.status).toBe(400);
    });

    it('POST /api/auth/register rejects duplicate login', async () => {
        const s = suffix();
        const login = `dup_${s}`;
        const body = {
            login,
            email: `a_${s}@test.local`,
            password: 'password123',
            displayName: 'A'
        };
        const first = await request(app).post('/api/auth/register').send(body);
        expect(first.status).toBe(201);
        const second = await request(app)
            .post('/api/auth/register')
            .send({
                ...body,
                email: `b_${s}@test.local`
            });
        expect(second.status).toBe(409);
    });

    it('GET /api/auth/me without token returns 401', async () => {
        await request(app).get('/api/auth/me').expect(401);
    });

    it('GET /api/auth/me with invalid Bearer returns 401', async () => {
        await request(app).get('/api/auth/me').set('Authorization', 'Bearer not-a-jwt').expect(401);
    });

    it('GET /api/auth/me returns user after registration', async () => {
        const s = suffix();
        const login = `me_${s}`;
        const reg = await request(app)
            .post('/api/auth/register')
            .send({
                login,
                email: `me_${s}@test.local`,
                password: 'password123',
                displayName: 'Me User'
            });
        expect(reg.status).toBe(201);
        const token = reg.body.token as string;
        const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.user?.login).toBe(login);
        expect(res.body.user?.userId).toBeTruthy();
    });

    it('PUT /api/auth/profile without token returns 401', async () => {
        await request(app).put('/api/auth/profile').send({ preferredRole: 'attacker' }).expect(401);
    });

    it('PUT /api/auth/profile empty body returns 400', async () => {
        const s = suffix();
        const reg = await request(app)
            .post('/api/auth/register')
            .send({
                login: `prof_${s}`,
                email: `prof_${s}@test.local`,
                password: 'password123',
                displayName: 'Prof'
            });
        const token = reg.body.token as string;
        const res = await request(app).put('/api/auth/profile').set('Authorization', `Bearer ${token}`).send({});
        expect(res.status).toBe(400);
    });

    it('PUT /api/auth/profile invalid preferredRole returns 400', async () => {
        const s = suffix();
        const reg = await request(app)
            .post('/api/auth/register')
            .send({
                login: `pr_${s}`,
                email: `pr_${s}@test.local`,
                password: 'password123',
                displayName: 'PR'
            });
        const token = reg.body.token as string;
        const res = await request(app)
            .put('/api/auth/profile')
            .set('Authorization', `Bearer ${token}`)
            .send({ preferredRole: 'fighter' });
        expect(res.status).toBe(400);
    });

    it('PUT /api/auth/profile sets preferredRole attacker', async () => {
        const s = suffix();
        const reg = await request(app)
            .post('/api/auth/register')
            .send({
                login: `pr_ok_${s}`,
                email: `pr_ok_${s}@test.local`,
                password: 'password123',
                displayName: 'PR OK'
            });
        const token = reg.body.token as string;
        const res = await request(app)
            .put('/api/auth/profile')
            .set('Authorization', `Bearer ${token}`)
            .send({ preferredRole: 'attacker' });
        expect(res.status).toBe(200);
        expect(res.body.profile?.preferredRole).toBe('attacker');
    });
});

(hasDb ? describe : describe.skip)('Game API extensions', () => {
    const suffix = () => `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    async function registerAndToken() {
        const s = suffix();
        const login = `gap_${s}`;
        const reg = await request(app)
            .post('/api/auth/register')
            .send({
                login,
                email: `gap_${s}@test.local`,
                password: 'password123',
                displayName: 'Gap'
            });
        expect(reg.status).toBe(201);
        return reg.body.token as string;
    }

    it('GET /api/game/tank-presets returns presets array', async () => {
        const token = await registerAndToken();
        const res = await request(app).get('/api/game/tank-presets').set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.presets)).toBe(true);
    });

    it('POST /api/game/tank-presets rejects invalid body', async () => {
        const token = await registerAndToken();
        const res = await request(app)
            .post('/api/game/tank-presets')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: '', color: 0, hullNum: 0, trackNum: 0, turretNum: 0, weaponNum: 0 });
        expect(res.status).toBe(400);
    });

    it('POST /api/game/tank-presets creates preset', async () => {
        const token = await registerAndToken();
        const res = await request(app)
            .post('/api/game/tank-presets')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Test preset',
                color: 2,
                hullNum: 1,
                trackNum: 1,
                turretNum: 1,
                weaponNum: 1
            });
        expect(res.status).toBe(201);
        expect(res.body.preset?.name).toBe('Test preset');
        expect(res.body.preset?.presetId).toBeTruthy();
    });

    it('GET /api/game/replays/:id/playback returns 404 for unknown replay', async () => {
        const token = await registerAndToken();
        const res = await request(app)
            .get('/api/game/replays/00000000-0000-0000-0000-000000000000/playback')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(404);
    });

    it('GET /api/game/matches/history returns array', async () => {
        const token = await registerAndToken();
        const res = await request(app).get('/api/game/matches/history').set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.matches)).toBe(true);
    });

    it('POST /api/game/replays/:id/share returns 404 for unknown replay', async () => {
        const token = await registerAndToken();
        const res = await request(app)
            .post('/api/game/replays/00000000-0000-0000-0000-000000000000/share')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(404);
    });

    it('DELETE /api/game/replays/:id/share returns 404 for unknown replay', async () => {
        const token = await registerAndToken();
        const res = await request(app)
            .delete('/api/game/replays/00000000-0000-0000-0000-000000000000/share')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(404);
    });
});

(hasDb ? describe : describe.skip)('Public replay API', () => {
    it('GET /api/public/gallery returns list payload', async () => {
        const res = await request(app).get('/api/public/gallery').query({ limit: 5 });
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.replays)).toBe(true);
    });

    it('GET /api/public/replays/by-slug/unknown/playback returns 404', async () => {
        const res = await request(app).get('/api/public/replays/by-slug/nosuchslug999/playback');
        expect(res.status).toBe(404);
    });

    it('GET /api/public/gallery/replay/:id/stats returns 404 for unknown replay', async () => {
        const res = await request(app).get(
            '/api/public/gallery/replay/00000000-0000-0000-0000-000000000000/stats'
        );
        expect(res.status).toBe(404);
    });
});
