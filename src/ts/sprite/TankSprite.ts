import {Sprite} from "./Sprite";

export class TankSprite {
    public static readonly TRACK_INDENT: number = 1;
    private static readonly PROPORTION_WIDTH_HEIGHT: number = 246 / 42;
    private readonly _parts: Sprite[];
    public constructor(parts: Sprite[]) {
        this._parts = parts;
        // const widthTrack = HullSprite.WIDTH[hullNum] + TankSprite.TRACK_INDENT;
        // const heightTrack = Math.round(widthTrack / TankSprite.PROPORTION_WIDTH_HEIGHT);
        // this._trackSpriteL = new TrackSprite(
        //     x0 - TankSprite.TRACK_INDENT * Math.sin(angle),
        //     y0 - TankSprite.TRACK_INDENT * Math.cos(angle),
        //     angle, trackNum, widthTrack, heightTrack, field
        // );
        // this._trackSpriteR = new TrackSprite(
        //     x0 + (HullSprite.HEIGHT[hullNum] + TankSprite.TRACK_INDENT - heightTrack) * Math.sin(angle),
        //     y0 + (HullSprite.HEIGHT[hullNum] + TankSprite.TRACK_INDENT - heightTrack) * Math.cos(angle),
        //     angle, trackNum, widthTrack, heightTrack, field
        // );
        // this._hullSprite = new HullSprite(x0, y0, angle, hullColor, hullNum, field);
        // this._movementSpeed = movementSpeed;
        // this._angleSpeed = angleSpeed;
        // this._isDeltaChanged = false;
        // this.calcDeltaCoordinates();
    }
    public updatePos(x: number, y: number, angle: number) {
        this._parts.forEach((sprite: Sprite) => {sprite.setPosition(x, y, angle)});
    }
    public updateAngle(x: number, y: number, angle: number) {
        this._parts.forEach((sprite: Sprite) => {sprite.setAngle(x, y, angle)});
    }
}