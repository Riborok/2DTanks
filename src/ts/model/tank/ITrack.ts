import {MovementParameters} from "../../additionally/type";

export interface ITrack {
    get angleSpeed(): number;
    get movementParameters(): MovementParameters;
}

export class TrackModel0 implements ITrack{
    private readonly _angleSpeed: number = 0.045;
    private readonly _movementParameters: MovementParameters = {
        forwardAcceleration: 0.045,
        backwardAcceleration: 0.035,
        finishForwardSpeed: 4.8,
        finishBackwardSpeed: 2.4
    }
    public get angleSpeed(): number { return this._angleSpeed }
    public get movementParameters(): MovementParameters { return this._movementParameters }
    public constructor(weight: number) {
        this._angleSpeed /= weight;
        this._movementParameters.forwardAcceleration /= weight;
        this._movementParameters.backwardAcceleration /= weight;
        this._movementParameters.finishForwardSpeed /= weight;
        this._movementParameters.finishBackwardSpeed /= weight;
    }
}