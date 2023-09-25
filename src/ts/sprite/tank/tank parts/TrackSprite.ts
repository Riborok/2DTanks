import {Point} from "../../../geometry/Point";
import {ResolutionManager} from "../../../constants/gameConstants";
import {IFrameByFrame, ISpritePart, Sprite} from "../../ISprite";

export abstract class TrackSprite extends Sprite implements ISpritePart, IFrameByFrame {
    abstract calcPosition(point: Point, sin: number, cos: number): Point;

    private static readonly PROPORTION_WIDTH_HEIGHT: number = 42 / 246;
    private static readonly ORIGINAL_WIDTH: number = 246;
    private static readonly ORIGINAL_HEIGHT: number = 42;

    private readonly _num: number;
    private _frame: number = 0;
    protected static calcHeight(width: number) { return TrackSprite.PROPORTION_WIDTH_HEIGHT * width; }
    public get num() { return this._num }
    protected constructor(num: number, tankWidth: number, height: number) {
        const zIndex: number = 3;
        super(tankWidth + ResolutionManager.TRACK_INDENT, height, zIndex);
        this._num = num;
        this._sprite.src = `src/img/tanks/Tracks/Track_${num}.png`;
    }
    public set frame(value: number) {
        this._frame = value;
    }
    public get frame(): number {
        return this._frame;
    }
    public get originalWidth(): number { return TrackSprite.ORIGINAL_WIDTH }
    public get originalHeight(): number { return TrackSprite.ORIGINAL_HEIGHT }
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
    public calcPosition(point: Point): Point { return point.clone(); }
}
export class BottomTrackSprite extends TrackSprite  {
    private readonly _deltaHeight: number;
    public constructor(num: number, tankWidth: number, tankHeight: number) {
        const height = TrackSprite.calcHeight(tankWidth);
        super(num, tankWidth, height);
        this._deltaHeight = tankHeight + ResolutionManager.TRACK_INDENT - height;
    }
    /**
     * Calculates the initial position of the bottom track sprite based on a reference point,
     * while considering the rotation angle represented by sine and cosine values.
     * @param point The reference point, which is the starting point of the hull, for position calculation.
     * @param sin The sine value of the rotation angle.
     * @param cos The cosine value of the rotation angle.
     * @returns The calculated initial position of the bottom track sprite.
     */
    public calcPosition(point: Point, sin: number, cos: number): Point {
        return new Point(
            point.x - this._deltaHeight * sin,
            point.y + this._deltaHeight * cos
        );
    }
}