import type { IncomingMessage } from 'http';
import { parseWsUserFromRequest } from '../../src/ws/parseWsUser';
import { signAccessToken } from '../../src/auth/jwt';

describe('parseWsUserFromRequest', () => {
    const OLD = process.env.JWT_SECRET;

    beforeEach(() => {
        process.env.JWT_SECRET = 'parse-ws-user-test-secret-min-32-chars!!';
    });

    afterEach(() => {
        if (OLD !== undefined) {
            process.env.JWT_SECRET = OLD;
        } else {
            delete process.env.JWT_SECRET;
        }
    });

    function reqWithUrl(url: string): IncomingMessage {
        return { url } as IncomingMessage;
    }

    it('returns user when token query param is valid', () => {
        const token = signAccessToken({
            sub: 'user-uuid-1',
            login: 'tanker',
            displayName: 'Танкист'
        });
        const u = parseWsUserFromRequest(reqWithUrl(`/?token=${encodeURIComponent(token)}`));
        expect(u).not.toBeNull();
        expect(u!.userId).toBe('user-uuid-1');
        expect(u!.login).toBe('tanker');
        expect(u!.displayName).toBe('Танкист');
    });

    it('returns null when token missing', () => {
        expect(parseWsUserFromRequest(reqWithUrl('/'))).toBeNull();
    });

    it('returns null when token invalid', () => {
        expect(parseWsUserFromRequest(reqWithUrl('/?token=garbage'))).toBeNull();
    });
});
