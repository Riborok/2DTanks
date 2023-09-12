import {MotionData} from "../../additionally/type";
import {IComponent} from "../IComponent";

export interface ITrack extends IComponent{
    get angularData(): MotionData;
    get forwardData(): MotionData;
    get backwardData(): MotionData;
}

export class TrackModel0 implements ITrack{
    private readonly _angularData: MotionData = { finishSpeed: 0.0175, force: 0.03 }
    private readonly _forwardData: MotionData = { finishSpeed: 3, force: 0.03 }
    private readonly _backwardData: MotionData = { finishSpeed: 2, force: 0.025 }
    public get angularData(): MotionData { return this._angularData }
    public get forwardData(): MotionData { return this._forwardData }
    public get backwardData(): MotionData { return this._backwardData }
    public get num(): number { return 0 }
}