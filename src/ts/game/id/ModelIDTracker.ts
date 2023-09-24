/**
 * Manages the unique identifiers for different game entities.
 * It ensures that each entity is assigned a unique ID within its category.
 */
export class ModelIDTracker {
    private constructor() { }

    private static readonly TANK_TYPE: number = 0;
    private static readonly WALL_TYPE: number = 1;
    private static readonly BULLET_TYPE: number = 2;

    private static readonly TYPE_DIVIDER: number = 1000;
    private static extractType(id: number): number {
        return id % ModelIDTracker.TYPE_DIVIDER;
    }

    /**
     * Check if a given ID belongs to a tank entity.
     * @param id The ID to check.
     * @returns True if the ID belongs to a tank, false otherwise.
     */
    public static isTank(id: number): boolean {
        return ModelIDTracker.extractType(id) === ModelIDTracker.TANK_TYPE;
    }

    /**
     * Check if a given ID belongs to a wall entity.
     * @param id The ID to check.
     * @returns True if the ID belongs to a wall, false otherwise.
     */
    public static isWall(id: number): boolean {
        return ModelIDTracker.extractType(id) === ModelIDTracker.WALL_TYPE;
    }

    /**
     * Check if a given ID belongs to a bullet entity.
     * @param id The ID to check.
     * @returns True if the ID belongs to a bullet, false otherwise.
     */
    public static isBullet(id: number): boolean {
        return ModelIDTracker.extractType(id) === ModelIDTracker.BULLET_TYPE;
    }

    private static readonly MAX_VALUE = Math.floor(Number.MAX_SAFE_INTEGER / ModelIDTracker.TYPE_DIVIDER) - 1;
    private static checkForMaxValue(id: number) {
        if (id >= ModelIDTracker.MAX_VALUE)
            throw new Error("Maximum ID is reached.");
    }

    /**
     * Get a unique ID for a tank entity.
     * @returns A unique ID for a tank.
     */
    private static TANK_ID: number = 0;
    public static get tankId(): number {
        ModelIDTracker.checkForMaxValue(ModelIDTracker.TANK_ID);
        return ++ModelIDTracker.TANK_ID * ModelIDTracker.TYPE_DIVIDER + ModelIDTracker.TANK_TYPE;
    }

    /**
     * Get a unique ID for a wall entity.
     * @returns A unique ID for a wall.
     */
    private static WALL_ID: number = 0;
    public static get wallId(): number {
        ModelIDTracker.checkForMaxValue(ModelIDTracker.WALL_ID);
        return ++ModelIDTracker.WALL_ID * ModelIDTracker.TYPE_DIVIDER + ModelIDTracker.WALL_TYPE;
    }

    /**
     * Get a unique ID for a bullet entity.
     * @returns A unique ID for a bullet.
     */
    private static BULLET_ID: number = 0;
    public static get bulletId(): number {
        ModelIDTracker.checkForMaxValue(ModelIDTracker.BULLET_ID);
        return ++ModelIDTracker.BULLET_ID * ModelIDTracker.TYPE_DIVIDER + ModelIDTracker.BULLET_TYPE;
    }
}
