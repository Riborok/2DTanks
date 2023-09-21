import {IAnimationManager} from "./AnimationManager";
import {Point} from "../../../geometry/Point";
import {BulletElement} from "../../elements/BulletElement";
import {AnimationMaker} from "./AnimationMaker";
import {IElement} from "../../elements/IElement";
import {BulletModel} from "../../../model/bullet/BulletModel";
import {calcMidBetweenTwoPoint} from "../../../geometry/additionalFunc";

interface IAnimator {
    get animationManager(): IAnimationManager;
}

export interface IBulletAnimator extends IAnimator {
    createImpactAnimation(collisionPoint: Point, bulletElement: BulletElement): void;
    createDeadAnimation(element: IElement): void;
}

export interface ITankAnimator extends IAnimator {
    createShootAnimation(bulletModel: BulletModel, num: number): void;
}

export class BulletAnimator implements IBulletAnimator {
    private readonly _animationManager: IAnimationManager;
    public constructor(animationManager: IAnimationManager) { this._animationManager = animationManager }
    public get animationManager(): IAnimationManager { return this._animationManager }
    public createImpactAnimation(collisionPoint: Point, bulletElement: BulletElement) {
        this._animationManager.add(AnimationMaker.playImpactAnimation(collisionPoint,
            bulletElement.model.entity.angle + Math.PI, bulletElement.sprite.num));
    }
    public createDeadAnimation(element: IElement) {
        this._animationManager.add(AnimationMaker.playDeathAnimation(element.model.entity));
    }
}

export class TankAnimator implements ITankAnimator {
    private readonly _animationManager: IAnimationManager;
    public constructor(animationManager: IAnimationManager) { this._animationManager = animationManager }
    public get animationManager(): IAnimationManager { return this._animationManager }
    public createShootAnimation(bulletModel: BulletModel, num: number) {
        this._animationManager.add(AnimationMaker.playShootAnimation(
            calcMidBetweenTwoPoint(bulletModel.entity.points[0], bulletModel.entity.points[3]),
            bulletModel.entity.angle,
            num
        ));
    }
}