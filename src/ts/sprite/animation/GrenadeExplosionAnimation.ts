import {AnimationSprite} from "./IAnimation";
import {IFrameByFrame} from "../ISprite";
import {Point} from "../../geometry/Point";

export class GrenadeExplosionAnimation extends AnimationSprite implements IFrameByFrame {
    private static readonly UPDATE_TIMER_TIME: number = 50;
    private static readonly MAX_FRAME: number = 9;
    private static readonly ORIGINAL_SIZE: number = 800;

    protected get UPDATE_TIMER_TIME(): number { return GrenadeExplosionAnimation.UPDATE_TIMER_TIME }
    protected get MAX_FRAME(): number { return GrenadeExplosionAnimation.MAX_FRAME }
    public constructor(point: Point, angle: number, size: number) {
        const zIndex: number = 1;
        super(size, size, zIndex);
        this._imgSprite.src = `src/img/tanks/Effects/Sprites/Grenade_Effects_Explosion.png`;

        this._point = new Point(
            point.x - size / 2,
            point.y - size / 2
        );
        this._angle = angle;
    }
    public set frame(value: number) {
        this._frame = value;
    }
    public get frame(): number {
        return this._frame;
    }
    public get originalWidth(): number { return GrenadeExplosionAnimation.ORIGINAL_SIZE }
    public get originalHeight(): number { return GrenadeExplosionAnimation.ORIGINAL_SIZE }
}