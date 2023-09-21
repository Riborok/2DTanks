import {Sprite} from "../Sprite";
import {Point} from "../../geometry/Point";
import {IAnimation} from "./IAnimation";

abstract class TankDriftAnimation extends Sprite implements IAnimation{
    private _animationStage: number = 0;
    private _isEnded: boolean = false;
    private _timer: number = 0;
    private static readonly DEFAULT_PATH: string = 'src/img/tanks/Effects/Sprites/Sprite_Effects_Smoke_';
    private static readonly UPDATE_TIMER_TIME: number = 60;
    private static readonly MAX_STAGE: number = 9;
    public get isEnded(): boolean {
        return this._isEnded;
    }
    protected constructor(width: number, height: number) {
        super(width, height, 5);
        this._sprite.src = `${TankDriftAnimation.DEFAULT_PATH}${this._animationStage}.png`;
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
}
export class TopTankDriftAnimation extends TankDriftAnimation {
    public constructor(width: number, height: number) {
        super(width, height);
        this._scaleX = -1;
    }
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