import {Sprite} from "../Sprite";
import {Point} from "../../geometry/Point";
import {IAnimation} from "./IAnimation";

export class TankExplosionAnimation extends Sprite implements IAnimation{
    private _animationStage: number = 0;
    private _isEnded: boolean = false;
    private _timer: number = 0;
    private static readonly DEFAULT_PATH: string = 'src/img/tanks/Effects/Sprites/Sprite_Effects_Explosion_';
    private static readonly UPDATE_TIMER_TIME: number = 90;
    private static readonly MAX_STAGE: number = 8;
    private static readonly WIDTH: number = 120;
    private static readonly HEIGHT: number = 120;
    get isEnded(): boolean {
        if (this._isEnded)
            this.remove();
        return this._isEnded;
    }
    constructor(point: Point, angle: number) {
        super(TankExplosionAnimation.WIDTH, TankExplosionAnimation.HEIGHT);
        this._sprite.src = `${TankExplosionAnimation.DEFAULT_PATH}${this._animationStage}.png`;
        this._sprite.style.zIndex = `7`;

        const newPoint = new Point(
            point.x - TankExplosionAnimation.WIDTH / 2,
            point.y - TankExplosionAnimation.HEIGHT / 2
        )
        this.setPosAndAngle(newPoint, angle);
    }
    private setPosAndAngle(point: Point, angle: number){
        this.setPosition(point);
        this.setAngle(angle);
    }
    public changeStage(deltaTime: number): void {
        this._timer += deltaTime;
        if (this._timer >= TankExplosionAnimation.UPDATE_TIMER_TIME){
            this._timer -= TankExplosionAnimation.UPDATE_TIMER_TIME;

            this._animationStage++;
            if (this._animationStage <= TankExplosionAnimation.MAX_STAGE) {
                this._sprite.src = `${TankExplosionAnimation.DEFAULT_PATH}${this._animationStage}.png`;
            } else {
                this._isEnded = true;
            }
        }
    }
}