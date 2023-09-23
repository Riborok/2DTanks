import {IFrameByFrame, IScalable} from "../ISprite";
import {Point} from "../../geometry/Point";
import {AnimationSprite} from "./IAnimation";

abstract class TankDriftAnimation extends AnimationSprite implements IFrameByFrame{
    private static readonly UPDATE_TIMER_TIME: number = 60;
    private static readonly MAX_FRAME: number = 9;
    private static readonly ORIGINAL_SIZE: number = 496;

    protected get UPDATE_TIMER_TIME(): number { return TankDriftAnimation.UPDATE_TIMER_TIME }
    protected get MAX_FRAME(): number { return TankDriftAnimation.MAX_FRAME }
    protected constructor(width: number, height: number) {
        super(width, height, 1);
        this._sprite.src = `src/img/tanks/Effects/Sprites/Sprite_Effects_Smoke.png`;
    }
    public set frame(value: number) {
        this._frame = value;
    }
    public get frame(): number {
        return this._frame;
    }
    public get originalWidth(): number { return TankDriftAnimation.ORIGINAL_SIZE }
    public get originalHeight(): number { return TankDriftAnimation.ORIGINAL_SIZE }
}
export class TopTankDriftAnimation extends TankDriftAnimation implements IScalable {
    public constructor(width: number, height: number) {
        super(width, height);
    }
    public get scaleX(): number { return -1 }
    public get scaleY(): number { return 1 }
    public calcPosition(point: Point, sin: number, cos: number): Point{
        return new Point(
            point.x + this.width * sin + this.height * cos,
            point.y - this.width * cos + this.height * sin,
        );
    }
}
export class BottomTankDriftAnimation extends TankDriftAnimation{
    private readonly _trackHeight: number
    public constructor(width: number, height: number, trackHeight: number) {
        super(width, height);
        this._trackHeight = trackHeight;
    }
    public calcPosition(point: Point, sin: number, cos: number): Point {
        return new Point(
            point.x - this._trackHeight * sin + this.height * cos,
            point.y + this._trackHeight * cos + this.height * sin
        );
    }
}