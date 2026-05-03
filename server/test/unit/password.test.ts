import { hashPassword, verifyPassword } from '../../src/auth/password';

describe('password', () => {
    it('verifyPassword accepts correct plain text', async () => {
        const hash = await hashPassword('correct horse battery staple');
        await expect(verifyPassword('correct horse battery staple', hash)).resolves.toBe(true);
    });

    it('verifyPassword rejects wrong password', async () => {
        const hash = await hashPassword('secret12345');
        await expect(verifyPassword('wrong', hash)).resolves.toBe(false);
    });
});
