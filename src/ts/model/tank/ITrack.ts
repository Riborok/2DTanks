export interface ITrack {
    get angleSpeed(): number;
    get initialMovementSpeed(): number;
    get finishMovementSpeed(): number;
    get MovementAcceleration(): number;
}

export class TrackModel0 implements ITrack{
    public get angleSpeed(): number { return 0.025 }
    public get initialMovementSpeed(): number { return 0.75 }
    public get finishMovementSpeed(): number { return 3 }
    public get MovementAcceleration(): number { return 0.00625 }
}