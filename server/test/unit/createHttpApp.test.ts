import request from 'supertest';
import { createHttpApp } from '../../src/createHttpApp';

describe('createHttpApp', () => {
    const app = createHttpApp();

    it('GET /api/health returns ok', async () => {
        const res = await request(app).get('/api/health');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ ok: true });
    });
});
