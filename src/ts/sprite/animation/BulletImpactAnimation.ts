import {Sprite} from "../Sprite";
import {Point} from "../../geometry/Point";
import {IAnimation} from "./IAnimation";
import {SpriteManipulator} from "../SpriteManipulator";

export class BulletImpactAnimation extends Sprite implements IAnimation{
    private _animationStage: number = 0;
    private _isEnded: boolean = false;
    private _timer: number = 0;
    private readonly _num: number;
    private static readonly DEFAULT_PATH: string = 'src/img/tanks/Effects/Sprites/Sprite_Fire_Shots_Impact_';
    private static readonly UPDATE_TIMER_TIME: number = 60;
    private static readonly MAX_STAGE: number = 3;
    public get isEnded(): boolean {
        if (this._isEnded)
            this.remove();
        return this._isEnded;
    }
    public constructor(point: Point, angle: number, width: number, height: number, num: number) {
        super(width, height);
        this._num = num === 0 ? 0 : 1;
        this._sprite.src = `${BulletImpactAnimation.DEFAULT_PATH}${this._num}_${this._animationStage}.png`;
        this._sprite.style.zIndex = `7`;

        const newPoint = new Point(
            point.x + height / 2 * Math.sin(angle),
            point.y - height / 2 * Math.cos(angle)
        );
        SpriteManipulator.rotateToDefaultSpritePoint(this, newPoint, Math.sin(angle), Math.cos(angle));
        this.setPosAndAngle(newPoint, angle);
    }
    private setPosAndAngle(point: Point, angle: number){
        this.setPosition(point);
        this.setAngle(angle);
    }
    public changeStage(deltaTime: number): void {
        this._timer += deltaTime;
        if (this._timer >= BulletImpactAnimation.UPDATE_TIMER_TIME){
            this._timer -= BulletImpactAnimation.UPDATE_TIMER_TIME;

            this._animationStage++;
            if (this._animationStage <= BulletImpactAnimation.MAX_STAGE) {
                this._sprite.src = `${BulletImpactAnimation.DEFAULT_PATH}${this._num}_${this._animationStage}.png`;
            } else {
                this._isEnded = true;
            }
        }
    }
}