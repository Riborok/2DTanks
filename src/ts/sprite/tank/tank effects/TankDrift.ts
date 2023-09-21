import {Point} from "../../../geometry/Point";
import {clampAngle} from "../../../geometry/additionalFunc";
import {BottomTankDriftAnimation, TopTankDriftAnimation} from "../../animation/TankDriftAnimation";
import {IAnimationManager} from "../../../game/managers/AnimationManager";
import {SpriteManipulator} from "../../SpriteManipulator";
import {Canvas} from "../../../game/Canvas";

export enum rotDirection{
    rotLeft = -1,
    rotStraight = 0,
    rotRight = 1,
    rotNoRotate = 2
}

export class TankDrift {
    private readonly _animationManager: IAnimationManager;
    private readonly _width: number;
    private readonly _height: number;
    private readonly _trackHeight: number;
    private _currAnimation: TopTankDriftAnimation | BottomTankDriftAnimation;
    private _delayedAngle: number = 0;
    private static readonly UPDATE_SMOKE_DELTA_ANGLE: number = 0.113446;
    public constructor(animationManager: IAnimationManager, trackWidth: number, trackHeight: number) {
        this._animationManager = animationManager;
        this._width = trackWidth / 4;
        this._height = trackWidth / 5;
        this._trackHeight = trackHeight;
    }
    public detectRotateDirection(angle: number): number{
        if (angle >= Math.PI / 2 && angle <= Math.PI && this._delayedAngle >= -Math.PI && this._delayedAngle <= -Math.PI / 2 ||
            this._delayedAngle >= Math.PI / 2 && this._delayedAngle <= Math.PI && angle >= -Math.PI && angle <= -Math.PI / 2) {
            if (this._delayedAngle >= 0) {
                angle = clampAngle(angle, 0, 2 * Math.PI)
            } else {
                angle = clampAngle(angle, -2 * Math.PI, 0)
            }
        }
        const deltaAngle: number = angle - this._delayedAngle;
        if (deltaAngle < 0 && Math.abs(deltaAngle) > TankDrift.UPDATE_SMOKE_DELTA_ANGLE) {
            this._delayedAngle = clampAngle(angle, -Math.PI, Math.PI);
            return rotDirection.rotLeft
        }
        else if (deltaAngle > 0 && Math.abs(deltaAngle) > TankDrift.UPDATE_SMOKE_DELTA_ANGLE) {
            this._delayedAngle = clampAngle(angle, -Math.PI, Math.PI);
            return  rotDirection.rotRight
        }
        else { return  rotDirection.rotNoRotate }

    }
    private setPosAndAngle(point: Point, angle: number){
        const newSin: number = Math.sin(angle);
        const newCos: number = Math.cos(angle);
        SpriteManipulator.rotateToDefaultSpritePoint(this._currAnimation, point, newSin, newCos);
        this._currAnimation.point = point;
        this._currAnimation.angle = angle;
    }
    private addAnimation(){
        this._animationManager.add(this._currAnimation);
    }
    public spawnTopSmoke(topPoint: Point, angle: number, sin: number, cos: number){
        this._currAnimation = new TopTankDriftAnimation(this._width, this._height);

        let point: Point = this._currAnimation.calcPosition(topPoint, sin, cos);
        const correctedAngle: number = angle + 1.5708;

        this.setPosAndAngle(point, correctedAngle);

        this.addAnimation();
    }
    public spawnBottomSmoke(bottomPoint: Point, angle: number, sin: number, cos: number){
        this._currAnimation = new BottomTankDriftAnimation(this._width, this._height, this._trackHeight);

        let point: Point = this._currAnimation.calcPosition(bottomPoint, sin, cos);
        const correctedAngle: number = angle + 1.5708;

        this.setPosAndAngle(point, correctedAngle);

        this.addAnimation();
    }
}