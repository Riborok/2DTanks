import {IEntity} from "../../model/entitiy/IEntity";
import {ICollisionDetection} from "../../model/entitiy/IEntityCollisionSystem";
import {CollisionResolver} from "../../geometry/CollisionResolver";

export interface ICollisionManager {
    hasCollision(entity: IEntity): boolean;
}

export class CollisionManager implements ICollisionManager {
    private readonly _collisionDetection: ICollisionDetection;
    public constructor(collisionDetection: ICollisionDetection) {
        this._collisionDetection = collisionDetection;
    }
    public hasCollision(entity: IEntity) : boolean {
        const collisionsInfo = this._collisionDetection.getCollisions(entity);

         for (const collisionInfo of collisionsInfo)
             CollisionResolver.resolveCollision(entity, collisionInfo);

        return collisionsInfo.length === 0;
    }
}