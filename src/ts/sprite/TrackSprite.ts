import {Sprite} from "./Sprite";
import {Point} from "../model/Point";
import {TRACK_INDENT} from "../constants";

abstract class TrackSprite extends Sprite {
    private readonly _srcState0: string;
    private readonly _srcState1: string;
    private _state: number;
    private _counter: number;
    private static readonly STATE_CHANGE_THRESHOLD: number = 3;
    private static readonly PROPORTION_WIDTH_HEIGHT: number = 42 / 246;
    protected static calcHeight(width: number) {
        return TrackSprite.PROPORTION_WIDTH_HEIGHT * width;
    }

    private readonly _width: number;
    private readonly _height: number;
    public get width(): number { return this._width }
    public get height(): number { return this._height }
    protected constructor(num: number, tankWidth: number, height: number) {
        const width = tankWidth + TRACK_INDENT;
        super(width, height);
        this._width = width;
        this._height = height;

        this._srcState0 = `src/img/tanks/Tracks/Track_${num}_A.png`;
        this._srcState1 = `src/img/tanks/Tracks/Track_${num}_B.png`;
        this._state = 0;
        this._counter = 0;
        this._sprite.src = this._srcState0;
    }
    private changeState() {
        this._counter++;
        if (this._counter === TrackSprite.STATE_CHANGE_THRESHOLD) {
            this._state ^= 1;
            this._sprite.src = this._state === 1 ? this._srcState1 : this._srcState0;
            this._counter = 0;
        }
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
}
export class DownTrackSprite extends TrackSprite  {
    private readonly _deltaHeight: number;
    public constructor(num: number, tankWidth: number, tankHeight: number) {
        const height = TrackSprite.calcHeight(tankWidth);
        super(num, tankWidth, height);
        this._deltaHeight = tankHeight + TRACK_INDENT - height;
    }
    public calcPosition(point: Point, angle: number): Point {
        return new Point(
            point.x - this._deltaHeight * Math.sin(angle),
            point.y + this._deltaHeight * Math.cos(angle)
        );
    }
}