import {TankSpritePart} from "./Sprite";
import {Point} from "../model/Point";
import {TRACK_INDENT} from "../constants/gameConstants";

abstract class TrackSprite extends TankSpritePart {
    private readonly _srcState0: string;
    private readonly _srcState1: string;
    private _state: number;
    private _counter: number;
    private _currentThreshold: number;
    private static readonly MIN_STATE_CHANGE_THRESHOLD: number = 2;
    private static readonly MAX_STATE_CHANGE_THRESHOLD: number = 15;
    private static readonly PROPORTION_WIDTH_HEIGHT: number = 42 / 246;
    protected static calcHeight(width: number) {
        return TrackSprite.PROPORTION_WIDTH_HEIGHT * width;
    }
    protected constructor(num: number, tankWidth: number, height: number) {
        super(tankWidth + TRACK_INDENT, height);

        this._srcState0 = `src/img/tanks/Tracks/Track_${num}_A.png`;
        this._srcState1 = `src/img/tanks/Tracks/Track_${num}_B.png`;
        this._sprite.style.zIndex = `3`;
        this._state = 0;
        this._counter = 0;
        this._sprite.src = this._srcState0;
        this._currentThreshold = TrackSprite.MAX_STATE_CHANGE_THRESHOLD;
    }
    private changeState() {
        this._counter++;
        if (this._counter === this._currentThreshold) {
            this._state ^= 1;
            this._sprite.src = this._state === 1 ? this._srcState1 : this._srcState0;
            this._counter = 0;
            if (this._currentThreshold > TrackSprite.MIN_STATE_CHANGE_THRESHOLD)
                this._currentThreshold--;
        }
    }
    public setPosition(point: Point) {
        this.changeState();
        super.setPosition(point);
    }
    public brake() {
        this._currentThreshold = TrackSprite.MAX_STATE_CHANGE_THRESHOLD;
    }
}

export class TopTrackSprite extends TrackSprite  {
    public constructor(num: number, tankWidth: number) {
        super(num, tankWidth, TrackSprite.calcHeight(tankWidth));
    }
    /**
     * Calculates the initial position of the top track sprite based on a reference point.
     * This function returns a copy of the provided reference point.
     * @param point The reference point, which is the starting point of the top track sprite, for position calculation.
     * @returns A copy of the provided reference point, representing the initial position of the top track sprite.
     */
    public override calcPosition(point: Point): Point { return point.clone(); }
}
export class BottomTrackSprite extends TrackSprite  {
    private readonly _deltaHeight: number;
    public constructor(num: number, tankWidth: number, tankHeight: number) {
        const height = TrackSprite.calcHeight(tankWidth);
        super(num, tankWidth, height);
        this._deltaHeight = tankHeight + TRACK_INDENT - height;
    }
    /**
     * Calculates the initial position of the bottom track sprite based on a reference point,
     * while considering the rotation angle represented by sine and cosine values.
     * @param point The reference point, which is the starting point of the hull, for position calculation.
     * @param sin The sine value of the rotation angle.
     * @param cos The cosine value of the rotation angle.
     * @returns The calculated initial position of the bottom track sprite.
     */
    public override calcPosition(point: Point, sin: number, cos: number): Point {
        return new Point(
            point.x - this._deltaHeight * sin,
            point.y + this._deltaHeight * cos
        );
    }
}