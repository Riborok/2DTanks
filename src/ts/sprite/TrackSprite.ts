import {Sprite} from "./Sprite";
import {Point} from "../model/Point";

abstract class TrackSprite extends Sprite {
    private readonly _srcState0: string;
    private readonly _srcState1: string;
    private _state: number;
    private static readonly PROPORTION_WIDTH_HEIGHT: number = 42 / 246;
    protected static readonly INDENT: number = 1;
    protected static calcHeight(width: number) {
        return Math.round(TrackSprite.PROPORTION_WIDTH_HEIGHT * width);
    }

    public abstract calcPosition(point: Point, angle: number): Point;
    protected constructor(num: number, tankWidth: number, height: number) {
        super(tankWidth + TrackSprite.INDENT, height);

        this._srcState0 = `src/img/tanks/Tracks/Track_${num}_A.png`;
        this._srcState1 = `src/img/tanks/Tracks/Track_${num}_B.png`;
        this._state = 0;
        this._sprite.src = this._srcState0;
    }
    private changeState() {
        this._state++; this._state %= 2;
        if (this._state === 1)
            this._sprite.src = this._srcState1;
        else
            this._sprite.src = this._srcState0;
    }
    public setPosition(point: Point) {
        this.changeState();
        super.setPosition(point);
    }
}

export class UpTrackSprite extends TrackSprite  {
    public constructor(num: number, tankWidth: number) {
        super(num, tankWidth, TrackSprite.calcHeight(tankWidth));
    }
    public override calcPosition(point: Point, angle: number): Point {
        return new Point(
            point.x - TrackSprite.INDENT * Math.sin(angle),
            point.y - TrackSprite.INDENT * Math.cos(angle)
        );
    }
}
export class DownTrackSprite extends TrackSprite  {
    private readonly _deltaHeight: number;
    public constructor(num: number, tankWidth: number, tankHeight: number) {
        const height = TrackSprite.calcHeight(tankWidth);
        super(num, tankWidth, height);
        this._deltaHeight = tankHeight + TrackSprite.INDENT - height;
    }
    public override calcPosition(point: Point, angle: number): Point {
        return new Point(
            point.x + this._deltaHeight * Math.sin(angle),
            point.y + this._deltaHeight * Math.cos(angle)
        );
    }
}