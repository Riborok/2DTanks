import { isAllowedCorsOrigin } from '../../src/createHttpApp';

describe('isAllowedCorsOrigin', () => {
    const OLD = process.env.CORS_ORIGINS;

    afterEach(() => {
        if (OLD !== undefined) {
            process.env.CORS_ORIGINS = OLD;
        } else {
            delete process.env.CORS_ORIGINS;
        }
    });

    it('allows undefined origin', () => {
        expect(isAllowedCorsOrigin(undefined)).toBe(true);
    });

    it('allows localhost with port', () => {
        expect(isAllowedCorsOrigin('http://localhost:8081')).toBe(true);
        expect(isAllowedCorsOrigin('http://127.0.0.1:3000')).toBe(true);
    });

    it('allows private LAN origins', () => {
        expect(isAllowedCorsOrigin('http://192.168.1.10:5173')).toBe(true);
        expect(isAllowedCorsOrigin('https://10.0.0.1')).toBe(true);
        expect(isAllowedCorsOrigin('http://172.20.0.5:3000')).toBe(true);
    });

    it('respects CORS_ORIGINS extra list', () => {
        process.env.CORS_ORIGINS = 'https://example.com,https://app.example.org';
        expect(isAllowedCorsOrigin('https://example.com')).toBe(true);
        expect(isAllowedCorsOrigin('https://unknown.dev')).toBe(false);
    });
});
