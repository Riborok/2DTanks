import {IAnimationManager} from "./AnimationManager";
import {Point} from "../../../geometry/Point";
import {BulletElement} from "../../elements/BulletElement";
import {AnimationMaker} from "./AnimationMaker";
import {IElement} from "../../elements/IElement";
import {IBulletModel} from "../../../model/bullet/IBulletModel";
import {calcMidBetweenTwoPoint} from "../../../geometry/additionalFunc";

interface IAnimator {
    get animationManager(): IAnimationManager;
}

export interface IBulletAnimator extends IAnimator {
    createImpactAnimation(collisionPoint: Point, bulletElement: BulletElement): void;
    createExplosionAnimation(collisionPoint: Point, size: number, angle: number): void;
    createDeadAnimation(collisionPoint: Point, element: IElement): void;
}

export interface ITankAnimator extends IAnimator {
    createShootAnimation(bulletModel: IBulletModel, num: number): void;
}

export class BulletAnimator implements IBulletAnimator {
    private readonly _animationManager: IAnimationManager;
    public constructor(animationManager: IAnimationManager) { this._animationManager = animationManager }
    public get animationManager(): IAnimationManager { return this._animationManager }
    public createImpactAnimation(collisionPoint: Point, bulletElement: BulletElement) {
        this._animationManager.add(AnimationMaker.playImpactAnimation(collisionPoint,
            bulletElement.model.entity.angle + Math.PI, bulletElement.sprite.num));
    }
    public createExplosionAnimation(collisionPoint: Point, size: number, angle: number) {
        this._animationManager.add(AnimationMaker.playGrenadeExplosionAnimation(collisionPoint, size, angle));
    }
    public createDeadAnimation(collisionPoint: Point, element: IElement) {
        this._animationManager.add(AnimationMaker.playDeathAnimation(collisionPoint, element));
    }
}

export class TankAnimator implements ITankAnimator {
    private readonly _animationManager: IAnimationManager;
    public constructor(animationManager: IAnimationManager) { this._animationManager = animationManager }
    public get animationManager(): IAnimationManager { return this._animationManager }
    public createShootAnimation(bulletModel: IBulletModel, num: number) {
        this._animationManager.add(AnimationMaker.playShootAnimation(
            calcMidBetweenTwoPoint(bulletModel.entity.points[0], bulletModel.entity.points[3]),
            bulletModel.entity.angle,
            num
        ));
    }
}