import {Sprite} from "../Sprite";
import {Point} from "../../geometry/Point";
import {IAnimation} from "./IAnimation";

abstract class TankDriftAnimation extends Sprite implements IAnimation{
    private _animationStage: number = 0;
    private _isEnded: boolean = false;
    private _timer: number = TankDriftAnimation.UPDATE_TIMER_TIME;
    private static readonly DEFAULT_PATH: string = 'src/img/tanks/Effects/Sprites/Sprite_Effects_Smoke_';
    private static readonly UPDATE_TIMER_TIME: number = 60;
    private static readonly MAX_STAGE: number = 9;
    public get isEnded(): boolean {
        if (this._isEnded)
            this.remove();
        return this._isEnded
    }
    public constructor(width: number, height: number) {
        super(width, height);
        this._sprite.src = `${TankDriftAnimation.DEFAULT_PATH}${this._animationStage}.png`;
        this._sprite.style.zIndex = `6`;
    }
    public changeStage(deltaTime: number): void {
        this._timer += deltaTime;
        if (this._timer >= TankDriftAnimation.UPDATE_TIMER_TIME){
            this._timer -= TankDriftAnimation.UPDATE_TIMER_TIME;

            this._animationStage++;
            if (this._animationStage <= TankDriftAnimation.MAX_STAGE) {
                this._sprite.src = `${TankDriftAnimation.DEFAULT_PATH}${this._animationStage}.png`;
            } else {
                this._isEnded = true;
            }
        }
    }
    public remove(){
        this._sprite.remove();
    }
}
export class TopTankDriftAnimation extends TankDriftAnimation{
    public setPosAndAngle(point: Point, angle: number){
        this.setPosition(point);
        this.setAngle(angle, -1, 1);
    }
    public calcPosition(point: Point, sin: number, cos: number): Point{
        return new Point(
            point.x + this.width * sin + this.height * cos,
            point.y - this.width * cos + this.height * sin,
        )
    }
}
export class BottomTankDriftAnimation extends TankDriftAnimation{
    private readonly _trackHeight: number
    constructor(width: number, height: number, trackHeight: number) {
        super(width, height);
        this._trackHeight = trackHeight;
    }
    public setPosAndAngle(point: Point, angle: number){
        this.setPosition(point);
        this.setAngle(angle);
    }
    public calcPosition(point: Point, sin: number, cos: number): Point {
        return new Point(
            point.x - this._trackHeight * sin + this.height * cos,
            point.y + this._trackHeight * cos + this.height * sin
        )
    }
}