import {ModelIDTracker} from "../../id/ModelIDTracker";
import {IEntity} from "../../../entitiy/entity/IEntity";
import {TankExplosionAnimation} from "../../../sprite/animation/TankExplosionAnimation";
import {getRandomInt} from "../../../additionally/additionalFunc";
import {Point} from "../../../geometry/Point";
import {BulletImpactAnimation} from "../../../sprite/animation/BulletImpactAnimation";
import {BULLET_ANIMATION_SIZE_INCREASE_COEFF, ResolutionManager} from "../../../constants/gameConstants";
import {TankShootAnimation} from "../../../sprite/animation/TankShootAnimation";
import {IAnimation} from "../../../sprite/animation/IAnimation";

export class AnimationMaker{
    public static playDeathAnimation(entity: IEntity): IAnimation {
        if (ModelIDTracker.isWall(entity.id)){

        }

        if (ModelIDTracker.isTank(entity.id)){
            return new TankExplosionAnimation(
                entity.calcCenter(),
                getRandomInt(-Math.PI, Math.PI)
            );
        }

        if (ModelIDTracker.isBullet(entity.id)){

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
}