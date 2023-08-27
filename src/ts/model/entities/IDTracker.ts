export class IDTracker {
    private constructor() { }

    public static readonly STARTING_TANK_ID: number = 0;
    public static readonly STARTING_WALL_ID: number = 1000;
    public static readonly STARTING_BULLET_ID: number = 2000;

    private static TANK_ID: number = IDTracker.STARTING_TANK_ID;
    private static WALL_ID: number = IDTracker.STARTING_WALL_ID;
    private static BULLET_ID: number = IDTracker.STARTING_BULLET_ID;

    public static get tankId(): number { return IDTracker.TANK_ID++ }
    public static get wallId(): number { return IDTracker.WALL_ID++ }
    public static get bulletId(): number { return IDTracker.BULLET_ID++ }
}