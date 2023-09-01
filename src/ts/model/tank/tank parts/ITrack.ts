import {MotionData} from "../../../additionally/type";

export interface ITrack {
    get angularData(): MotionData;
    get forwardData(): MotionData;
    get backwardData(): MotionData;
}

export class TrackModel0 implements ITrack{
    private readonly _angularData: MotionData = { finishSpeed: 0.0175, force: 0.03 }
    private readonly _forwardData: MotionData = { finishSpeed: 4, force: 0.03 }
    private readonly _backwardData: MotionData = { finishSpeed: 2.75, force: 0.025}
    public get angularData(): MotionData { return this._angularData }
    public get forwardData(): MotionData { return this._forwardData }
    public get backwardData(): MotionData { return this._backwardData }
}