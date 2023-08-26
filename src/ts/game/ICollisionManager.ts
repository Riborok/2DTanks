import {IEntity} from "../model/entities/IEntity";
import {ICollisionDetection} from "../model/entities/IEntityCollisionSystem";

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
        const isSuccess = collisions.length === 0;

        return isSuccess;
    }
}