import {ModelIDTracker} from "../../id/ModelIDTracker";
import {TankExplosionAnimation} from "../../../sprite/animation/TankExplosionAnimation";
import {getRandomInt} from "../../../additionally/additionalFunc";
import {Point} from "../../../geometry/Point";
import {BulletImpactAnimation} from "../../../sprite/animation/BulletImpactAnimation";
import {BULLET_ANIMATION_SIZE_INCREASE_COEFF, ResolutionManager} from "../../../constants/gameConstants";
import {TankShootAnimation} from "../../../sprite/animation/TankShootAnimation";
import {IAnimation} from "../../../sprite/animation/IAnimation";
import {IElement} from "../../elements/IElement";
import {BulletElement} from "../../elements/BulletElement";
import {GrenadeExplosionAnimation} from "../../../sprite/animation/GrenadeExplosionAnimation";

export class AnimationMaker{
    public static playDeathAnimation(collisionPoint: Point, element: IElement): IAnimation {
        if (ModelIDTracker.isWall(element.id)){

        }

        if (ModelIDTracker.isTank(element.id)){
            return new TankExplosionAnimation(
                element.model.entity.calcCenter(),
                getRandomInt(-Math.PI, Math.PI)
            );
        }

        if (ModelIDTracker.isBullet(element.id)){
            const bulletElement = <BulletElement>element;
            return this.playImpactAnimation(collisionPoint, bulletElement.model.entity.angle + Math.PI,
                bulletElement.sprite.num);
        }
    }
    public static playImpactAnimation(point: Point, angle: number, num: number): IAnimation{
        return new BulletImpactAnimation(
            point, angle,
            ResolutionManager.BULLET_WIDTH[num] * BULLET_ANIMATION_SIZE_INCREASE_COEFF,
            ResolutionManager.BULLET_HEIGHT[num] * BULLET_ANIMATION_SIZE_INCREASE_COEFF,
            num);
    }
    public static playShootAnimation(point: Point, angle: number, num: number): IAnimation{
        return new TankShootAnimation(
            point, angle,
            ResolutionManager.BULLET_WIDTH[num] * BULLET_ANIMATION_SIZE_INCREASE_COEFF,
            ResolutionManager.BULLET_HEIGHT[num] * BULLET_ANIMATION_SIZE_INCREASE_COEFF,
            num);
    }
    public static playGrenadeExplosionAnimation(collisionPoint: Point, size: number, angle: number): IAnimation {
        return new GrenadeExplosionAnimation(collisionPoint, angle, size);
    }
}