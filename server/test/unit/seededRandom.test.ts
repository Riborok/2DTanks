import { SeededRandom } from '../../src/utils/seededRandom';

describe('SeededRandom', () => {
    it('same seed produces same sequence', () => {
        const a = new SeededRandom(12345);
        const b = new SeededRandom(12345);
        expect(a.nextFloat()).toBe(b.nextFloat());
        expect(a.nextFloat()).toBe(b.nextFloat());
    });

    it('different seeds produce different first values', () => {
        const a = new SeededRandom(1);
        const b = new SeededRandom(2);
        expect(a.nextFloat()).not.toBe(b.nextFloat());
    });

    it('nextFloat stays in [0, 1)', () => {
        const r = new SeededRandom(999);
        for (let i = 0; i < 50; i++) {
            const x = r.nextFloat();
            expect(x).toBeGreaterThanOrEqual(0);
            expect(x).toBeLessThan(1);
        }
    });

    it('nextInt inclusive range', () => {
        const r = new SeededRandom(42);
        for (let i = 0; i < 30; i++) {
            const n = r.nextInt(3, 8);
            expect(n).toBeGreaterThanOrEqual(3);
            expect(n).toBeLessThanOrEqual(8);
        }
    });
});
