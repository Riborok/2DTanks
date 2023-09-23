import {IFrameByFrame} from "../ISprite";
import {Point} from "../../geometry/Point";
import {AnimationSprite} from "./IAnimation";
import {SpriteManipulator} from "../SpriteManipulator";

export class TankShootAnimation extends AnimationSprite implements IFrameByFrame {
    private static readonly UPDATE_TIMER_TIME: number = 45;
    private static readonly MAX_FRAME: number = 3;
    private static readonly ORIGINAL_WIDTH: number = 135;
    private static readonly ORIGINAL_HEIGHT: number = 202;

    protected get UPDATE_TIMER_TIME(): number { return TankShootAnimation.UPDATE_TIMER_TIME }
    protected get MAX_FRAME(): number { return TankShootAnimation.MAX_FRAME }
    public constructor(point: Point, angle: number, width: number, height: number, num: number) {
        super(width, height, 6);
        this._sprite.src = `src/img/tanks/Effects/Sprites/Sprite_Fire_Shots_Shot_${num === 0 ? 0 : 1}.png`;

        const newPoint = new Point(
            point.x + height / 2 * Math.sin(angle),
            point.y - height / 2 * Math.cos(angle)
        );
        SpriteManipulator.rotateToDefaultSpritePoint(this, newPoint, Math.sin(angle), Math.cos(angle));
        this._point = newPoint;
        this._angle = angle;
    }
    public set frame(value: number) {
        this._frame = value;
    }
    public get frame(): number {
        return this._frame;
    }
    public get originalWidth(): number { return TankShootAnimation.ORIGINAL_WIDTH }
    public get originalHeight(): number { return TankShootAnimation.ORIGINAL_HEIGHT }
}