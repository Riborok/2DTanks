import jwtLib from 'jsonwebtoken';
import { signAccessToken, verifyAccessToken, payloadToWsUser } from '../../src/auth/jwt';

describe('jwt', () => {
    const OLD = process.env.JWT_SECRET;

    beforeEach(() => {
        process.env.JWT_SECRET = 'unit-test-jwt-secret-minimum-32-characters-long';
    });

    afterEach(() => {
        if (OLD !== undefined) {
            process.env.JWT_SECRET = OLD;
        } else {
            delete process.env.JWT_SECRET;
        }
    });

    it('signAccessToken + verifyAccessToken round-trip', () => {
        const token = signAccessToken({
            sub: 'user-id-1',
            login: 'player',
            displayName: 'Игрок'
        });
        const payload = verifyAccessToken(token);
        expect(payload.sub).toBe('user-id-1');
        expect(payload.login).toBe('player');
        expect(payload.displayName).toBe('Игрок');
    });

    it('verifyAccessToken throws on tampered token', () => {
        const token = signAccessToken({
            sub: 'a',
            login: 'b',
            displayName: 'c'
        });
        const bad = token.slice(0, -4) + 'xxxx';
        expect(() => verifyAccessToken(bad)).toThrow();
    });

    it('signAccessToken throws when JWT_SECRET is missing', () => {
        delete process.env.JWT_SECRET;
        expect(() =>
            signAccessToken({
                sub: '1',
                login: 'u',
                displayName: 'U'
            })
        ).toThrow('JWT_SECRET is not set');
    });

    it('verifyAccessToken throws on incomplete payload', () => {
        const secret = process.env.JWT_SECRET!;
        const token = jwtLib.sign({ login: 'only' }, secret, { subject: 'sub-1', algorithm: 'HS256' });
        expect(() => verifyAccessToken(token)).toThrow('Invalid token payload');
    });

    it('payloadToWsUser maps fields', () => {
        expect(
            payloadToWsUser({
                sub: 'uuid-1',
                login: 'player',
                displayName: 'Игрок'
            })
        ).toEqual({
            userId: 'uuid-1',
            login: 'player',
            displayName: 'Игрок'
        });
    });
});
