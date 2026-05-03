import type { Request, Response, NextFunction } from 'express';
import { requireBearerAuth } from '../../src/auth/httpAuth';
import { signAccessToken } from '../../src/auth/jwt';

describe('requireBearerAuth', () => {
    const OLD = process.env.JWT_SECRET;

    beforeEach(() => {
        process.env.JWT_SECRET = 'http-auth-test-secret-minimum-32-characters-x';
    });

    afterEach(() => {
        if (OLD !== undefined) {
            process.env.JWT_SECRET = OLD;
        } else {
            delete process.env.JWT_SECRET;
        }
    });

    it('responds 401 when Authorization missing', () => {
        const req = { headers: {} } as Request;
        const json = jest.fn();
        const status = jest.fn().mockReturnValue({ json });
        const res = { status } as unknown as Response;
        const next = jest.fn() as NextFunction;

        requireBearerAuth(req, res, next);

        expect(status).toHaveBeenCalledWith(401);
        expect(json).toHaveBeenCalledWith({ error: 'Нет токена' });
        expect(next).not.toHaveBeenCalled();
    });

    it('responds 401 when token invalid', () => {
        const req = { headers: { authorization: 'Bearer not-a-jwt' } } as unknown as Request;
        const json = jest.fn();
        const status = jest.fn().mockReturnValue({ json });
        const res = { status } as unknown as Response;
        const next = jest.fn() as NextFunction;

        requireBearerAuth(req, res, next);

        expect(status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('calls next and sets req.auth for valid Bearer token', () => {
        const token = signAccessToken({
            sub: 'sub-1',
            login: 'player1',
            displayName: 'P1'
        });
        const req = {
            headers: { authorization: `Bearer ${token}` }
        } as unknown as Request;
        const json = jest.fn();
        const status = jest.fn().mockReturnValue({ json });
        const res = { status } as unknown as Response;
        const next = jest.fn() as NextFunction;

        requireBearerAuth(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.auth?.sub).toBe('sub-1');
        expect(req.auth?.login).toBe('player1');
    });
});
