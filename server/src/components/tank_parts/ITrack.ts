import {MotionData} from "../../utils/types";
import {IComponent} from "../IComponent";

export interface ITrack extends IComponent{
    angularData: MotionData;
    forwardData: MotionData;
    backwardData: MotionData;
}

/** Гусеницы 0–3: универсал / скорость / тяга / разворот. */
export class TrackModel0 implements ITrack{
    private static readonly ANGULAR_DATA: MotionData = { finishSpeed: 0.017, force: 0.025 }
    private static readonly FORWARD_DATA: MotionData = { finishSpeed: 2.22, force: 0.0215 }
    private static readonly BACKWARD_DATA: MotionData = { finishSpeed: 1.55, force: 0.017 }
    private static readonly NUM: number = 0;
    public angularData: MotionData = { ...TrackModel0.ANGULAR_DATA }
    public forwardData: MotionData = { ...TrackModel0.FORWARD_DATA }
    public backwardData: MotionData = { ...TrackModel0.BACKWARD_DATA }
    public get num(): number { return TrackModel0.NUM }
}

export class TrackModel1 implements ITrack{
    private static readonly ANGULAR_DATA: MotionData = { finishSpeed: 0.0165, force: 0.018 }
    private static readonly FORWARD_DATA: MotionData = { finishSpeed: 2.48, force: 0.0205 }
    private static readonly BACKWARD_DATA: MotionData = { finishSpeed: 1.8, force: 0.0165 }
    private static readonly NUM: number = 1;
    public angularData: MotionData = { ...TrackModel1.ANGULAR_DATA }
    public forwardData: MotionData = { ...TrackModel1.FORWARD_DATA }
    public backwardData: MotionData = { ...TrackModel1.BACKWARD_DATA }
    public get num(): number { return TrackModel1.NUM }
}

export class TrackModel2 implements ITrack{
    private static readonly ANGULAR_DATA: MotionData = { finishSpeed: 0.017, force: 0.018 }
    private static readonly FORWARD_DATA: MotionData = { finishSpeed: 1.55, force: 0.029 }
    private static readonly BACKWARD_DATA: MotionData = { finishSpeed: 0.78, force: 0.024 }
    private static readonly NUM: number = 2;
    public angularData: MotionData = { ...TrackModel2.ANGULAR_DATA }
    public forwardData: MotionData = { ...TrackModel2.FORWARD_DATA }
    public backwardData: MotionData = { ...TrackModel2.BACKWARD_DATA }
    public get num(): number { return TrackModel2.NUM }
}

export class TrackModel3 implements ITrack{
    private static readonly ANGULAR_DATA: MotionData = { finishSpeed: 0.0235, force: 0.031 }
    private static readonly FORWARD_DATA: MotionData = { finishSpeed: 1.46, force: 0.0135 }
    private static readonly BACKWARD_DATA: MotionData = { finishSpeed: 0.74, force: 0.0095 }
    private static readonly NUM: number = 3;
    public angularData: MotionData = { ...TrackModel3.ANGULAR_DATA }
    public forwardData: MotionData = { ...TrackModel3.FORWARD_DATA }
    public backwardData: MotionData = { ...TrackModel3.BACKWARD_DATA }
    public get num(): number { return TrackModel3.NUM }
}

