import {TankSpritePart} from "./Sprite";
import {Point} from "../model/Point";
import {TRACK_INDENT} from "../constants/gameConstants";
import {MovementParameters} from "../additionally/type";

abstract class TrackSprite extends TankSpritePart {
    private static readonly PROPORTION_WIDTH_HEIGHT: number = 42 / 246;
    private static readonly MIN_THRESHOLD_COEFF: number = 8.8;
    private static readonly MAX_THRESHOLD_COEFF: number = 0.42;
    private static readonly MIN_STATE_CHANGE_THRESHOLD_MINIMUM: number = 2;
    private static readonly MAX_STATE_CHANGE_THRESHOLD_MAXIMUM: number = 20;
    private readonly _srcState0: string;
    private readonly _srcState1: string;
    private _state: number;
    private _counter: number;
    private _currentThreshold: number;
    private _isForwardMovement: boolean;
    public _isResidualMovement: boolean;
    private readonly _minStateChangeThreshold: number[];
    private readonly _maxStateChangeThreshold: number[];
    protected static calcHeight(width: number) { return TrackSprite.PROPORTION_WIDTH_HEIGHT * width; }
    public set isForwardMovement(value: boolean) {
        this._isResidualMovement = false;
        if (this._isForwardMovement !== value) {
            this._isForwardMovement = value;
            this._currentThreshold = this._maxStateChangeThreshold[this._isForwardMovement ? 1 : 0];
        }
    }
    public setResidualMovement() { this._isResidualMovement = true }
    protected constructor(num: number, tankWidth: number, height: number, movementParameters: MovementParameters) {
        super(tankWidth + TRACK_INDENT, height);

        this._minStateChangeThreshold = [
            Math.max(Math.round(TrackSprite.MIN_THRESHOLD_COEFF / movementParameters.finishBackwardSpeed),
                TrackSprite.MIN_STATE_CHANGE_THRESHOLD_MINIMUM),
            Math.max(Math.round(TrackSprite.MIN_THRESHOLD_COEFF / movementParameters.finishForwardSpeed),
                TrackSprite.MIN_STATE_CHANGE_THRESHOLD_MINIMUM)
        ];

        this._maxStateChangeThreshold = [
            Math.min(Math.round(TrackSprite.MAX_THRESHOLD_COEFF / movementParameters.backwardAcceleration),
                TrackSprite.MAX_STATE_CHANGE_THRESHOLD_MAXIMUM),
            Math.min(Math.round(TrackSprite.MAX_THRESHOLD_COEFF / movementParameters.forwardAcceleration),
                TrackSprite.MAX_STATE_CHANGE_THRESHOLD_MAXIMUM)
        ];
        console.log(this)
        this._srcState0 = `src/img/tanks/Tracks/Track_${num}_A.png`;
        this._srcState1 = `src/img/tanks/Tracks/Track_${num}_B.png`;
        this._sprite.style.zIndex = `3`;
        this._state = 0;
        this._sprite.src = this._srcState0;
        this._counter = 0;
        this._isForwardMovement = true;
        this._currentThreshold = this._maxStateChangeThreshold[this._isForwardMovement ? 1 : 0];
    }
    private changeState() {
        this._counter++;
        if (this._counter >= this._currentThreshold) {
            this._counter = 0;
            this._state ^= 1;
            this._sprite.src = this._state === 1 ? this._srcState1 : this._srcState0;
            if (this._isResidualMovement) {
                if (this._currentThreshold < this._maxStateChangeThreshold[this._isForwardMovement ? 1 : 0])
                    this._currentThreshold++;
            }
            else if (this._currentThreshold > this._minStateChangeThreshold[this._isForwardMovement ? 1 : 0])
                this._currentThreshold--;
        }
    }
    public setPosition(point: Point) {
        this.changeState();
        super.setPosition(point);
    }
    public stopped() {
        this._currentThreshold = this._maxStateChangeThreshold[this._isForwardMovement ? 1 : 0];
    }
}

export class TopTrackSprite extends TrackSprite  {
    public constructor(num: number, tankWidth: number, movementParameters: MovementParameters) {
        super(num, tankWidth, TrackSprite.calcHeight(tankWidth), movementParameters);
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
    public constructor(num: number, tankWidth: number, tankHeight: number, movementParameters: MovementParameters) {
        const height = TrackSprite.calcHeight(tankWidth);
        super(num, tankWidth, height, movementParameters);
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