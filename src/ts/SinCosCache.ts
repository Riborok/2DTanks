class ValueCaching {
    private readonly cache: { [index: number]: number } = { };
    private readonly _calcFunc: (index: number) => number;
    private static readonly MAX_CACHE_SIZE: number = 42 << 1;
    public constructor(calcFunc: (index: number) => number) {
        this._calcFunc = calcFunc;
    };

    private getCachedValue(index: number): number | null {
        if (index in this.cache)
            return this.cache[index];

        return null;
    }

    private cacheValue(index: number, value: number) {
        if (Object.keys(this.cache).length > ValueCaching.MAX_CACHE_SIZE)
            this.cleanCache();

        this.cache[index] = value;
    }

    private cleanCache() {
        const keys : number[] = Object.keys(this.cache).map(Number);
        const removeCount : number = keys.length >> 1;
        for (let i : number = 0; i < removeCount; i++)
            delete this.cache[keys[i]];
    }

    public getValue(index: number): number {
        const cachedValue : number = this.getCachedValue(index);
        if (cachedValue !== null)
            return cachedValue;

        const value : number = this._calcFunc(index);
        this.cacheValue(index, value);

        return value;
    }
}

export class SinCache {
    private constructor() {}

    private static sinCache: ValueCaching = new ValueCaching(Math.sin);

    public static getSin(angle: number): number {
        return SinCache.sinCache.getValue(angle);
    }
}

export class CosCache {
    private constructor() {}

    private static cosCache: ValueCaching = new ValueCaching(Math.cos);

    public static getCos(angle: number): number {
        return CosCache.cosCache.getValue(angle);
    }
}
