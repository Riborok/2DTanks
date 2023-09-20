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

    // Current IDs for each entity type
    private static ID: number = 0;
    private static checkForMaxValue() {
        if (ModelIDTracker.ID >= Number.MAX_SAFE_INTEGER)
            throw new Error("Maximum ID is reached.");
    }
    private static getNextId(entityType: number): number {
        this.checkForMaxValue();
        return ++this.ID * this.TYPE_DIVIDER + entityType;
    }

    /**
     * Get a unique ID for a tank entity.
     * @returns A unique ID for a tank.
     */
    public static get tankId(): number {
        return ModelIDTracker.getNextId(ModelIDTracker.TANK_TYPE);
    }

    /**
     * Get a unique ID for a wall entity.
     * @returns A unique ID for a wall.
     */
    public static get wallId(): number {
        return ModelIDTracker.getNextId(ModelIDTracker.WALL_TYPE);
    }

    /**
     * Get a unique ID for a bullet entity.
     * @returns A unique ID for a bullet.
     */
    public static get bulletId(): number {
        return ModelIDTracker.getNextId(ModelIDTracker.BULLET_TYPE);
    }
}
