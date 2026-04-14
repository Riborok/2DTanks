export class SeededRandom {
    private state: number;

    public constructor(seed: number) {
        const normalized = seed >>> 0;
        this.state = normalized === 0 ? 0x6d2b79f5 : normalized;
    }

    /** Uniform in [0, 1). */
    public nextFloat(): number {
        this.state = (this.state + 0x6d2b79f5) >>> 0;
        let t = this.state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    /** Inclusive integer range [min, max]. */
    public nextInt(min: number, max: number): number {
        const lo = Math.min(min, max);
        const hi = Math.max(min, max);
        return Math.floor(this.nextFloat() * (hi + 1 - lo)) + lo;
    }
}
