class ValueCaching<TKey, TValue> {
    private readonly _cache: Map<TKey, TValue> = new Map();
    private readonly _calcFunc: (key: TKey) => TValue;
    private static readonly MAX_CACHE_SIZE: number = 42;

    public constructor(calcFunc: (key: TKey) => TValue) {
        this._calcFunc = calcFunc;
    }

    public getValue(key: TKey): TValue {
        if (this._cache.has(key))
            return this._cache.get(key);

        if (this._cache.size > ValueCaching.MAX_CACHE_SIZE)
            this._cache.clear();

        const value = this._calcFunc(key);
        this._cache.set(key, value);

        return value;
    }
}

export class SinCache {
    private constructor() {}
    private static readonly SIN_CACHE: ValueCaching<number, number> = new ValueCaching<number, number>(Math.sin);
    public static getSin(angle: number): number { return SinCache.SIN_CACHE.getValue(angle) }
}

export class CosCache {
    private constructor() {}
    private static readonly COS_CACHE: ValueCaching<number, number> = new ValueCaching<number, number>(Math.cos);
    public static getCos(angle: number): number { return CosCache.COS_CACHE.getValue(angle) }
}
