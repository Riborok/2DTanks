import {IFrameByFrame, Sprite} from "../Sprite";
import {Point} from "../../geometry/Point";
import {AnimationSprite, IAnimation} from "./IAnimation";
import {ResolutionManager} from "../../constants/gameConstants";

export class TankExplosionAnimation extends AnimationSprite implements IFrameByFrame{
    private static readonly UPDATE_TIMER_TIME: number = 90;
    private static readonly MAX_FRAME: number = 8;
    private static readonly ORIGINAL_SIZE: number = 256;

    protected get UPDATE_TIMER_TIME(): number { return TankExplosionAnimation.UPDATE_TIMER_TIME }
    protected get MAX_FRAME(): number { return TankExplosionAnimation.MAX_FRAME }
    public constructor(point: Point, angle: number) {
        super(ResolutionManager.EXPLOSION_SIZE, ResolutionManager.EXPLOSION_SIZE, 6);
        this._sprite.src = `src/img/tanks/Effects/Sprites/Sprite_Effects_Explosion.png`;

        this._point = new Point(
            point.x - ResolutionManager.EXPLOSION_SIZE / 2,
            point.y - ResolutionManager.EXPLOSION_SIZE / 2
        );
        this._angle = angle;
    }
    public set frame(value: number) {
        this._frame = value;
    }
    public get frame(): number {
        return this._frame;
    }
    public get originalWidth(): number { return TankExplosionAnimation.ORIGINAL_SIZE }
    public get originalHeight(): number { return TankExplosionAnimation.ORIGINAL_SIZE }
}