export interface ITurret {
    get angle(): number;
    clockwiseMovement(): void;
    counterclockwiseMovement(): void;
    incAngle(deltaAngle: number): void;
    get bulletCapacity(): number;
}

export class TurretModel0 implements ITurret{
    private _angle: number = 0;
    private static readonly ANGLE_SPEED: number = 0.05;
    public get angle(): number { return this._angle }
    public get bulletCapacity(): number { return 10 }
    public clockwiseMovement(): void { this._angle -= TurretModel0.ANGLE_SPEED }
    public counterclockwiseMovement(): void { this._angle += TurretModel0.ANGLE_SPEED }
    public incAngle(deltaAngle: number): void { this._angle += deltaAngle }
}