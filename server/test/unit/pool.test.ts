describe('db/pool', () => {
    const savedUrl = process.env.DATABASE_URL;

    beforeEach(() => {
        jest.resetModules();
    });

    afterEach(async () => {
        if (savedUrl === undefined) {
            delete process.env.DATABASE_URL;
        } else {
            process.env.DATABASE_URL = savedUrl;
        }
        const { closePool } = await import('../../src/db/pool');
        await closePool();
    });

    it('getPool returns null when DATABASE_URL is unset', async () => {
        delete process.env.DATABASE_URL;
        const { getPool } = await import('../../src/db/pool');
        expect(getPool()).toBeNull();
    });

    it('getPool returns null when DATABASE_URL is only whitespace', async () => {
        process.env.DATABASE_URL = '   \t  ';
        const { getPool } = await import('../../src/db/pool');
        expect(getPool()).toBeNull();
    });

    it('closePool resolves when pool was never created', async () => {
        delete process.env.DATABASE_URL;
        const { getPool, closePool } = await import('../../src/db/pool');
        expect(getPool()).toBeNull();
        await expect(closePool()).resolves.toBeUndefined();
    });
});
