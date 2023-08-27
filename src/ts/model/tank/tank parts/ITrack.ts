import {MovementParameters} from "../../../additionally/type";

export interface ITrack {
    get angleSpeed(): number;
    get movementParameters(): MovementParameters;
}

export class TrackModel0 implements ITrack{
    private readonly _angleSpeed: number = 0.04;
    private readonly _movementParameters: MovementParameters = {
        forwardAcceleration: 0.045,
        backwardAcceleration: 0.035,
        finishForwardSpeed: 5.2,
        finishBackwardSpeed: 2.6
    }
    public get angleSpeed(): number { return this._angleSpeed }
    public get movementParameters(): MovementParameters { return this._movementParameters }
    public constructor(mass: number) {
        this._angleSpeed /= mass;
        this._movementParameters.forwardAcceleration /= mass;
        this._movementParameters.backwardAcceleration /= mass;
        this._movementParameters.finishForwardSpeed /= mass;
        this._movementParameters.finishBackwardSpeed /= mass;
    }
}