import {MotionData} from "../../additionally/type";
import {IComponent} from "../IComponent";

export interface ITrack extends IComponent{
    angularData: MotionData;
    forwardData: MotionData;
    backwardData: MotionData;
}

export class TrackModel0 implements ITrack{
    private static readonly ANGULAR_DATA: MotionData = { finishSpeed: 0.0175, force: 0.03 }
    private static readonly FORWARD_DATA: MotionData = { finishSpeed: 3, force: 0.03 }
    private static readonly BACKWARD_DATA: MotionData = { finishSpeed: 2, force: 0.025 }
    private static readonly NUM: number = 0;

    public angularData: MotionData = { ...TrackModel0.ANGULAR_DATA }
    public forwardData: MotionData = { ...TrackModel0.FORWARD_DATA }
    public backwardData: MotionData = { ...TrackModel0.BACKWARD_DATA }
    public get num(): number { return TrackModel0.NUM }
}

export class TrackModel1 implements ITrack{
    private static readonly ANGULAR_DATA: MotionData = { finishSpeed: 0.019, force: 0.02 }
    private static readonly FORWARD_DATA: MotionData = { finishSpeed: 3.5, force: 0.02 }
    private static readonly BACKWARD_DATA: MotionData = { finishSpeed: 2.5, force: 0.015 }
    private static readonly NUM: number = 1;

    public angularData: MotionData = { ...TrackModel1.ANGULAR_DATA }
    public forwardData: MotionData = { ...TrackModel1.FORWARD_DATA }
    public backwardData: MotionData = { ...TrackModel1.BACKWARD_DATA }
    public get num(): number { return TrackModel1.NUM }
}

export class TrackModel2 implements ITrack{
    private static readonly ANGULAR_DATA: MotionData = { finishSpeed: 0.014, force: 0.015 }
    private static readonly FORWARD_DATA: MotionData = { finishSpeed: 4, force: 0.035 }
    private static readonly BACKWARD_DATA: MotionData = { finishSpeed: 3, force: 0.03 }
    private static readonly NUM: number = 2;

    public angularData: MotionData = { ...TrackModel2.ANGULAR_DATA }
    public forwardData: MotionData = { ...TrackModel2.FORWARD_DATA }
    public backwardData: MotionData = { ...TrackModel2.BACKWARD_DATA }
    public get num(): number { return TrackModel2.NUM }
}

export class TrackModel3 implements ITrack{
    private static readonly ANGULAR_DATA: MotionData = { finishSpeed: 0.03, force: 0.04 }
    private static readonly FORWARD_DATA: MotionData = { finishSpeed: 2, force: 0.025 }
    private static readonly BACKWARD_DATA: MotionData = { finishSpeed: 1, force: 0.02 }
    private static readonly NUM: number = 3;

    public angularData: MotionData = { ...TrackModel3.ANGULAR_DATA }
    public forwardData: MotionData = { ...TrackModel3.FORWARD_DATA }
    public backwardData: MotionData = { ...TrackModel3.BACKWARD_DATA }
    public get num(): number { return TrackModel3.NUM }
}