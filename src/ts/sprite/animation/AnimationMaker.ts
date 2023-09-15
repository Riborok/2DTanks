import {IDTracker} from "../../game/id/IDTracker";
import {Point} from "../../geometry/Point";
import {IAnimationManager} from "../../game/managers/AnimationManager";
import {IElement} from "../../game/elements/IElement";
import {IEntity} from "../../entitiy/IEntity";
import {TankExplosionAnimation} from "./TankExplosionAnimation";
import {getRandomInt} from "../../additionally/additionalFunc";

export class AnimationMaker{
    public static playDeathAnimation(entity: IEntity, animationManager: IAnimationManager, canvas: Element){
        if (IDTracker.isWall(entity.id)){

        }

        if (IDTracker.isTank(entity.id)){
            const deathAnimation = new TankExplosionAnimation(
                entity.calcCenter(),
                getRandomInt(-Math.PI, Math.PI)
            )
            animationManager.add(deathAnimation);
            canvas.appendChild(deathAnimation.sprite);
        }

        if (IDTracker.isBullet(entity.id)){

        }
    }
}