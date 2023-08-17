export interface ITrack {
    get movementSpeed(): number;
    get angleSpeed(): number;
}

export class TrackModel0 implements ITrack{
    public get angleSpeed(): number { return 0.05 }
    public get movementSpeed(): number { return 3 }
}