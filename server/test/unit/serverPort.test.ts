import { resolveListenPort } from '../../src/serverPort';

describe('resolveListenPort', () => {
    const origServer = process.env.SERVER_PORT;
    const origPort = process.env.PORT;

    afterEach(() => {
        if (origServer !== undefined) {
            process.env.SERVER_PORT = origServer;
        } else {
            delete process.env.SERVER_PORT;
        }
        if (origPort !== undefined) {
            process.env.PORT = origPort;
        } else {
            delete process.env.PORT;
        }
    });

    it('uses SERVER_PORT when both SERVER_PORT and PORT are set', () => {
        process.env.SERVER_PORT = '4000';
        process.env.PORT = '5000';
        expect(resolveListenPort()).toBe(4000);
    });

    it('uses PORT when SERVER_PORT is absent', () => {
        delete process.env.SERVER_PORT;
        process.env.PORT = '8080';
        expect(resolveListenPort()).toBe(8080);
    });

    it('defaults to 3000 when env empty', () => {
        delete process.env.SERVER_PORT;
        delete process.env.PORT;
        expect(resolveListenPort()).toBe(3000);
    });

    it('defaults to 3000 for invalid SERVER_PORT', () => {
        process.env.SERVER_PORT = 'not-a-number';
        delete process.env.PORT;
        expect(resolveListenPort()).toBe(3000);
    });

    it('defaults to 3000 for out-of-range SERVER_PORT', () => {
        process.env.SERVER_PORT = '70000';
        delete process.env.PORT;
        expect(resolveListenPort()).toBe(3000);
    });

    it('maps POSTGRES-like PORT to 3000', () => {
        delete process.env.SERVER_PORT;
        process.env.PORT = '5432';
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
        expect(resolveListenPort()).toBe(3000);
        expect(warn).toHaveBeenCalled();
        warn.mockRestore();
    });
});
