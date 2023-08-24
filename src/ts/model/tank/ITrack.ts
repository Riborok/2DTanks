export interface ITrack {
    get angleSpeed(): number;
    get finishBackwardSpeed(): number;
    get finishForwardSpeed(): number;
    get forwardAcceleration(): number;
    get backwardAcceleration(): number;
}

export class TrackModel0 implements ITrack{
    private readonly _angleSpeed: number = 0.02;
    private readonly _forwardAcceleration: number = 0.025;
    private readonly _backwardAcceleration: number = 0.0125;
    private readonly _finishForwardSpeed: number = 3;
    private readonly _finishBackwardSpeed: number = 1.5;
    public get angleSpeed(): number { return this._angleSpeed }
    public get finishBackwardSpeed(): number { return this._finishBackwardSpeed }
    public get finishForwardSpeed(): number { return this._finishForwardSpeed }
    public get forwardAcceleration(): number { return this._forwardAcceleration }
    public get backwardAcceleration(): number { return this._backwardAcceleration }
    public constructor(weight: number) {
        const weightCoefficient = 1 - weight * 0.05;

        this._angleSpeed *= weightCoefficient;
        this._forwardAcceleration *= weightCoefficient;
        this._backwardAcceleration *= weightCoefficient;
        this._finishForwardSpeed *= weightCoefficient;
        this._finishBackwardSpeed *= weightCoefficient;
    }
}