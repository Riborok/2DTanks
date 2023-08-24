import {MovementParameters} from "../../additionally/type";

export interface ITrack {
    get angleSpeed(): number;
    get movementParameters(): MovementParameters;
}

export class TrackModel0 implements ITrack{
    private readonly _angleSpeed: number = 0.02;
    private readonly _movementParameters: MovementParameters = {
        forwardAcceleration: 0.025,
        backwardAcceleration: 0.0125,
        finishForwardSpeed: 3,
        finishBackwardSpeed: 1.5
    }
    public get angleSpeed(): number { return this._angleSpeed }
    public get movementParameters(): MovementParameters { return this._movementParameters }
    public constructor(weight: number) {
        const weightCoefficient = 1 - weight * 0.05;

        this._angleSpeed *= weightCoefficient;
        this._movementParameters.forwardAcceleration *= weightCoefficient;
        this._movementParameters.backwardAcceleration *= weightCoefficient;
        this._movementParameters.finishForwardSpeed *= weightCoefficient;
        this._movementParameters.finishBackwardSpeed *= weightCoefficient;
    }
}