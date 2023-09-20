import {ModelIDTracker} from "../../game/id/ModelIDTracker";
import {IAnimationManager} from "../../game/managers/AnimationManager";
import {IEntity} from "../../entitiy/IEntity";
import {TankExplosionAnimation} from "./TankExplosionAnimation";
import {getRandomInt} from "../../additionally/additionalFunc";

export class AnimationMaker{
    public static playDeathAnimation(entity: IEntity, animationManager: IAnimationManager, canvas: Element){
        if (ModelIDTracker.isWall(entity.id)){

        }

        if (ModelIDTracker.isTank(entity.id)){
            const deathAnimation = new TankExplosionAnimation(
                entity.calcCenter(),
                getRandomInt(-Math.PI, Math.PI)
            );
            animationManager.add(deathAnimation);
            canvas.appendChild(deathAnimation.sprite);
        }

        if (ModelIDTracker.isBullet(entity.id)){

        }
    }
}