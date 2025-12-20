/**
 * Manages the unique identifiers for different game sprites.
 * It ensures that each sprite is assigned a unique ID within its zIndex.
 */
export class SpriteIDTracker {
    private constructor() { }

    private static readonly Z_INDEX_DIVIDER: number = 1000;
    /**
     * Extract the zIndex from a sprite's ID.
     * @param id The ID of the sprite.
     * @returns The zIndex of the sprite.
     */
    public static extractZIndex(id: number): number {
        return id % SpriteIDTracker.Z_INDEX_DIVIDER;
    }

    private static readonly MAX_VALUE = Math.floor(Number.MAX_SAFE_INTEGER / SpriteIDTracker.Z_INDEX_DIVIDER) - 1;
    private static checkForMaxValue(id: number) {
        if (id >= SpriteIDTracker.MAX_VALUE)
            throw new Error("Maximum ID is reached.");
    }

    /**
     * Generate a unique ID for a sprite with the specified zIndex.
     * @param zIndex The zIndex of the sprite.
     * @returns A unique ID for the sprite.
     */
    private static readonly IDs: number[] = new Array<number>();
    public static generate(zIndex: number): number {
        for (let i = this.IDs.length; i <= zIndex; i++)
            SpriteIDTracker.IDs.push(0);

        SpriteIDTracker.checkForMaxValue(SpriteIDTracker.IDs[zIndex]);
        return ++SpriteIDTracker.IDs[zIndex] * SpriteIDTracker.Z_INDEX_DIVIDER + zIndex;
    }
}