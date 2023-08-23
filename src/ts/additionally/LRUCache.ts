import {DoublyLinkedList} from "./DoublyLinkedList";

/**
 * A generic class for caching values based on keys.
 * The class holds a cache (implemented using a Map) and a calculation function.
 * It allows storing and retrieving calculated values while keeping the cache size limited.
 */
export class LRUCache<TKey, TValue> {
    private readonly _cache: Map<TKey, TValue> = new Map();
    private readonly _calcFunc: (key: TKey) => TValue;
    private readonly _maxCacheSize: number;
    private readonly _lruList: DoublyLinkedList<TKey> = new DoublyLinkedList<TKey>();

    /**
     * Creates a new instance of ValueCaching.
     * @param calcFunc The function to calculate values based on keys.
     * @param maxCacheSize The maximum size of the cache.
     */
    public constructor(calcFunc: (key: TKey) => TValue, maxCacheSize: number) {
        this._calcFunc = calcFunc;
        this._maxCacheSize = maxCacheSize;
    }

    /**
     * Gets a value from the cache based on the provided key.
     * If the value is not already cached, it calculates the value using the calculation function
     * and stores it in the cache.
     * If the cache size exceeds the maximum allowed size, the cache is cleared.
     * @param key The key for which to retrieve the value.
     * @returns The cached value or a newly calculated value.
     */
    public getValue(key: TKey): TValue {
        if (this._cache.has(key)) {
            this._lruList.moveToHead(key);
            return this._cache.get(key);
        }

        const value = this._calcFunc(key);
        this._cache.set(key, value);
        this._lruList.addToHead(key);

        if (this._cache.size > this._maxCacheSize) {
            const lruKey = this._lruList.tail.value;
            this._cache.delete(lruKey);
            this._lruList.removeFromTail();
        }

        return value;
    }
}

/**
 * A utility class for caching sine values.
 * It uses the ValueCaching class to cache sine values based on angles.
 */
export class SinCache {
    private constructor() {}
    private static readonly SIN_CACHE: LRUCache<number, number> = new LRUCache<number, number>(Math.sin, 42 >> 1);

    /**
     * Gets the sine value for a given angle.
     * If the value is not cached, it calculates the sine value and stores it in the cache.
     * @param angle The angle (in radians) for which to retrieve the sine value.
     * @returns The cached sine value or a newly calculated sine value.
     */
    public static getSin(angle: number): number {
        const normalizedAngle = normalizeAngle(angle);

        if (normalizedAngle <= HALF_PI)
            return SinCache.SIN_CACHE.getValue(normalizedAngle);
        else if (normalizedAngle <= PI)
            return SinCache.SIN_CACHE.getValue(PI - normalizedAngle);
        else if (normalizedAngle <= THREE_HALF_PI)
            return -SinCache.SIN_CACHE.getValue(normalizedAngle - PI);
        else
            return -SinCache.SIN_CACHE.getValue(TWO_PI - normalizedAngle);
    }
}

/**
 * A utility class for caching cosine values.
 * It uses the ValueCaching class to cache cosine values based on angles.
 */
export class CosCache {
    private constructor() {}
    private static readonly COS_CACHE: LRUCache<number, number> = new LRUCache<number, number>(Math.cos, 42 >> 1);

    /**
     * Gets the cosine value for a given angle.
     * If the value is not cached, it calculates the cosine value and stores it in the cache.
     * @param angle The angle (in radians) for which to retrieve the cosine value.
     * @returns The cached cosine value or a newly calculated cosine value.
     */
    public static getCos(angle: number): number {
        const normalizedAngle = normalizeAngle(angle);

        if (normalizedAngle <= HALF_PI)
            return CosCache.COS_CACHE.getValue(normalizedAngle);
        else if (normalizedAngle <= PI)
            return -CosCache.COS_CACHE.getValue(PI - normalizedAngle);
        else if (normalizedAngle <= THREE_HALF_PI)
            return -CosCache.COS_CACHE.getValue(normalizedAngle - PI);
        else
            return CosCache.COS_CACHE.getValue(TWO_PI - normalizedAngle);
    }
}

const PI: number = roundToTwoDecimalPlaces(Math.PI);
const TWO_PI: number = PI * 2;
const HALF_PI: number = PI / 2;
const THREE_HALF_PI: number = 3 * HALF_PI;

function normalizeAngle(angle: number): number {
    const roundedAngle = roundToTwoDecimalPlaces(angle);

    if (roundedAngle >= 0)
        return roundedAngle % TWO_PI;
    else
        return (roundedAngle % TWO_PI) + TWO_PI;
}

function roundToTwoDecimalPlaces(number: number) {
    return Math.floor(number * 100) / 100;
}