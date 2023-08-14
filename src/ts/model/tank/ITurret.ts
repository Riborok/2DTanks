export interface ITurret {
    get angle(): number;
    clockwiseMovement(): void;
    counterclockwiseMovement(): void;

    get bulletCapacity(): number;
}