export interface ITurret {
    get angle(): number;
    clockwiseMovement(): void;
    counterclockwiseMovement(): void;

    get bulletCapacity(): number;
}

class TurretModel0 implements ITurret{
    private _angle: number = 0;
    private static readonly ANGLE_SPEED: number = 0.05;
    get angle(): number { return this._angle }
    get bulletCapacity(): number { return 10 }
    clockwiseMovement(): void { this._angle -= TurretModel0.ANGLE_SPEED }
    counterclockwiseMovement(): void { this._angle += TurretModel0.ANGLE_SPEED }
}