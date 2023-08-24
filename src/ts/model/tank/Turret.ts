export abstract class Turret {
    protected _angle: number;
    public get angle(): number { return this._angle }
    public constructor(angle: number) { this._angle = angle }
    public incAngle(deltaAngle: number) { this._angle += deltaAngle }
    public abstract get bulletCapacity(): number;
    public abstract get severityCoeff(): number;
    public abstract clockwiseMovement(): void;
    public abstract counterclockwiseMovement(): void;
}

export class TurretModel0 extends Turret{
    private static readonly ANGLE_SPEED: number = 0.02;
    public override get bulletCapacity(): number { return 10 }
    public override get severityCoeff(): number { return 0 }
    public override clockwiseMovement(): void { this._angle += TurretModel0.ANGLE_SPEED }
    public override counterclockwiseMovement(): void { this._angle -= TurretModel0.ANGLE_SPEED }
}