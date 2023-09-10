/**
 * The IDTracker class manages the unique identifiers for different game entities.
 * It ensures that each entity is assigned a unique ID within its category.
 */
export class IDTracker {
    // Private constructor to prevent instantiation
    private constructor() { }

    // Range of IDs for tanks
    public static readonly STARTING_TANK_ID: number = 0;
    public static readonly ENDING_TANK_ID: number = IDTracker.STARTING_TANK_ID + 42_42_42_42_42_42_42;

    // Range of IDs for walls
    public static readonly STARTING_WALL_ID: number = IDTracker.ENDING_TANK_ID + 1;
    public static readonly ENDING_WALL_ID: number = IDTracker.STARTING_WALL_ID + 42_42_42_42_42_42_42;

    // Range of IDs for bullets
    public static readonly STARTING_BULLET_ID: number = IDTracker.ENDING_WALL_ID + 1;
    public static readonly ENDING_BULLET_ID: number = IDTracker.STARTING_BULLET_ID + 42_42_42_42_42_42_42;

    // Current IDs for each entity type
    private static TANK_ID: number = IDTracker.STARTING_TANK_ID;
    private static WALL_ID: number = IDTracker.STARTING_WALL_ID;
    private static BULLET_ID: number = IDTracker.STARTING_BULLET_ID;

    /**
     * Get the next available tank ID and increment the counter.
     * Throws an error if the maximum ID is reached.
     * @returns The unique ID for a tank.
     */
    public static get tankId(): number {
        if (IDTracker.TANK_ID > IDTracker.ENDING_TANK_ID)
            throw new Error("Maximum tank ID is reached");

        return IDTracker.TANK_ID++;
    }

    /**
     * Get the next available wall ID and increment the counter.
     * Throws an error if the maximum ID is reached.
     * @returns The unique ID for a wall.
     */
    public static get wallId(): number {
        if (IDTracker.WALL_ID > IDTracker.ENDING_WALL_ID)
            throw new Error("Maximum wall ID is reached");

        return IDTracker.WALL_ID++;
    }

    /**
     * Get the next available bullet ID and increment the counter.
     * Resets to the starting ID if the maximum ID is reached.
     * @returns The unique ID for a bullet.
     */
    public static get bulletId(): number {
        if (IDTracker.BULLET_ID > IDTracker.ENDING_BULLET_ID)
            IDTracker.BULLET_ID = IDTracker.STARTING_BULLET_ID;

        return IDTracker.BULLET_ID++;
    }
}
