import {Sprite} from "../Sprite";
import {Point} from "../../geometry/Point";
import {IAnimation} from "./IAnimation";

export class TankShootAnimation extends Sprite implements IAnimation{
    private _animationStage: number = 0;
    private _isEnded: boolean = false;
    private _timer: number = 0;
    private static readonly DEFAULT_PATH: string = 'src/img/tanks/Effects/Sprites/Sprite_Fire_Shots_Shot_0_';
    private static readonly UPDATE_TIMER_TIME: number = 55;
    private static readonly MAX_STAGE: number = 3;
    get isEnded(): boolean {
        if (this._isEnded)
            this.remove();
        return this._isEnded;
    }
    constructor(point: Point, angle: number, width: number, height: number) {
        super(width, height);
        this._sprite.src = `${TankShootAnimation.DEFAULT_PATH}${this._animationStage}.png`;
        this._sprite.style.zIndex = `7`;

        const newPoint = new Point(
            point.x + height / 2 * Math.sin(angle),
            point.y - height / 2 * Math.cos(angle)
        )
        this.setPosAndAngle(newPoint, angle);
    }
    private setPosAndAngle(point: Point, angle: number){
        this.setPosition(point);
        this.setAngle(angle);
    }
    public changeStage(deltaTime: number): void {
        this._timer += deltaTime;
        if (this._timer >= TankShootAnimation.UPDATE_TIMER_TIME){
            this._timer -= TankShootAnimation.UPDATE_TIMER_TIME;

            this._animationStage++;
            if (this._animationStage <= TankShootAnimation.MAX_STAGE) {
                this._sprite.src = `${TankShootAnimation.DEFAULT_PATH}${this._animationStage}.png`;
            } else {
                this._isEnded = true;
            }
        }
    }
}