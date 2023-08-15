class ValueCaching {
    private readonly cache: Map<number, number> = new Map();
    private readonly _calcFunc: (index: number) => number;
    private static readonly MAX_CACHE_SIZE: number = 42;

    public constructor(calcFunc: (index: number) => number) { this._calcFunc = calcFunc; }
    public getValue(index: number): number {
        if (this.cache.has(index))
            return this.cache.get(index);

        if (this.cache.size > ValueCaching.MAX_CACHE_SIZE)
            this.cache.clear();

        const value = this._calcFunc(index);
        this.cache.set(index, value);

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
