export interface ITrack {
    get angleSpeed(): number;
    get initialMovementSpeed(): number;
    get finishMovementSpeed(): number;
    get movementAcceleration(): number;
}

export class TrackModel0 implements ITrack{
    private readonly _movementAcceleration: number = 0.00625;
    private readonly _angleSpeed: number = 0.025;
    private readonly _finishMovementSpeed: number = 3;
    private readonly _initialMovementSpeed: number = 1;
    public get angleSpeed(): number { return this._angleSpeed }
    public get initialMovementSpeed(): number { return this._initialMovementSpeed }
    public get finishMovementSpeed(): number { return this._finishMovementSpeed }
    public get movementAcceleration(): number { return this._movementAcceleration }
    public constructor(severityCoeff: number) {
        this._angleSpeed *= severityCoeff;
        this._initialMovementSpeed *= severityCoeff;
        this._finishMovementSpeed *= severityCoeff;
        this._movementAcceleration *= severityCoeff;
    }
}