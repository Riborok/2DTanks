class ValueCaching {
    private readonly _cache: Map<number, number> = new Map();
    private readonly _calcFunc: (index: number) => number;
    private static readonly MAX_CACHE_SIZE: number = 42;

    public constructor(calcFunc: (index: number) => number) { this._calcFunc = calcFunc; }
    public getValue(index: number): number {
        if (this._cache.has(index))
            return this._cache.get(index);

        if (this._cache.size > ValueCaching.MAX_CACHE_SIZE)
            this._cache.clear();

        const value = this._calcFunc(index);
        this._cache.set(index, value);

        return value;
    }
}

export class SinCache {
    private constructor() {}

    private static readonly SIN_CACHE: ValueCaching = new ValueCaching(Math.sin);

    public static getSin(angle: number): number {
        return SinCache.SIN_CACHE.getValue(angle);
    }
}

export class CosCache {
    private constructor() {}

    private static readonly COS_CACHE: ValueCaching = new ValueCaching(Math.cos);

    public static getCos(angle: number): number {
        return CosCache.COS_CACHE.getValue(angle);
    }
}
