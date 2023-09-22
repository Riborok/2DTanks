import {IFrameByFrame, Sprite} from "../Sprite";
import {Point} from "../../geometry/Point";
import {IAnimation} from "./IAnimation";
import {ResolutionManager} from "../../constants/gameConstants";

export class TankExplosionAnimation extends Sprite implements IAnimation, IFrameByFrame{
    private static readonly ORIGINAL_SIZE: number = 256;
    private static readonly UPDATE_TIMER_TIME: number = 90;
    private static readonly MAX_STAGE: number = 8;

    private _frame: number = 0;
    private _isEnded: boolean = false;
    private _timer: number = 0;
    public get isEnded(): boolean {
        return this._isEnded;
    }
    public constructor(point: Point, angle: number) {
        super(ResolutionManager.EXPLOSION_SIZE, ResolutionManager.EXPLOSION_SIZE, 6);
        this._sprite.src = `src/img/tanks/Effects/Sprites/Sprite_Effects_Explosion.png`;

        this._point = new Point(
            point.x - ResolutionManager.EXPLOSION_SIZE / 2,
            point.y - ResolutionManager.EXPLOSION_SIZE / 2
        );
        this._angle = angle;
    }
    public changeStage(deltaTime: number): void {
        this._timer += deltaTime;
        if (this._timer >= TankExplosionAnimation.UPDATE_TIMER_TIME){
            this._timer -= TankExplosionAnimation.UPDATE_TIMER_TIME;

            this._frame++;
            if (this._frame > TankExplosionAnimation.MAX_STAGE) {
                this._frame = TankExplosionAnimation.MAX_STAGE;
                this._isEnded = true;
            }
        }
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