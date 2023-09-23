import {IFrameByFrame} from "../ISprite";
import {Point} from "../../geometry/Point";
import {AnimationSprite} from "./IAnimation";
import {SpriteManipulator} from "../SpriteManipulator";

export class BulletImpactAnimation extends AnimationSprite implements IFrameByFrame{
    private static readonly UPDATE_TIMER_TIME: number = 70;
    private static readonly MAX_FRAME: number = 3;
    private static readonly ORIGINAL_WIDTH: number = 120;
    private static readonly ORIGINAL_HEIGHT: number = 205;

    protected get UPDATE_TIMER_TIME(): number { return BulletImpactAnimation.UPDATE_TIMER_TIME }
    protected get MAX_FRAME(): number { return BulletImpactAnimation.MAX_FRAME }
    public constructor(point: Point, angle: number, width: number, height: number, num: number) {
        super(width, height, 6);
        this._sprite.src = `src/img/tanks/Effects/Sprites/Sprite_Fire_Shots_Impact_${num === 0 ? 0 : 1}.png`;

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
    public get originalWidth(): number { return BulletImpactAnimation.ORIGINAL_WIDTH }
    public get originalHeight(): number { return BulletImpactAnimation.ORIGINAL_HEIGHT }
}