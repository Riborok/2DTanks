export interface ITrack {
    get movementSpeed(): number;
    get angleSpeed(): number;
}

class TrackModel0 implements ITrack{
    get angleSpeed(): number {return 0.05}
    get movementSpeed(): number {return 3}
}