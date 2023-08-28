import {IEntity} from "../../model/entitiy/IEntity";
import {ICollisionDetection} from "../../model/entitiy/IEntityCollisionSystem";

export interface ICollisionManager {
    isSuccess(entity: IEntity): boolean;
}

export class CollisionManager implements ICollisionManager {
    private readonly _collisionDetection: ICollisionDetection;
    public constructor(collisionDetection: ICollisionDetection) {
        this._collisionDetection = collisionDetection;
    }
    public isSuccess(entity: IEntity) : boolean {
        const collisions = this._collisionDetection.getCollisions(entity);

        // for (const collision of collisions)
        //     CollisionResolver.resolveCollision(entity, collision);

        return collisions.length === 0;
    }
}