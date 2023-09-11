import {IEntity} from "../../model/entitiy/IEntity";
import {ICollisionDetection} from "../../model/entitiy/IEntityCollisionSystem";
import {CollisionResolver} from "../../geometry/CollisionResolver";
import {IDTracker} from "../id/IDTracker";
import {IdToProcessing, IIdToProcessing} from "./IdToProcessing";

export interface ICollisionManager {
    hasCollision(entity: IEntity): Iterable<IEntity> | null;
    get wallsForProcessing(): IIdToProcessing;
}

export class CollisionManager implements ICollisionManager {
    private readonly _collisionDetection: ICollisionDetection;
    private _wallsForProcessing: IIdToProcessing = new IdToProcessing();
    public get wallsForProcessing(): IIdToProcessing { return this._wallsForProcessing }
    public constructor(collisionDetection: ICollisionDetection) {
        this._collisionDetection = collisionDetection;
    }
    public hasCollision(entity: IEntity): Iterable<IEntity> | null {
        const receivingEntities = this._collisionDetection.getCollisions(entity);
        let hasCollision: boolean = false;

        for (const receivingEntity of receivingEntities) {
            CollisionResolver.resolveCollision(entity, receivingEntity);
            this.processCollision(receivingEntity);
            hasCollision = true;
        }

        return hasCollision ? receivingEntities : null;
    }
    private processCollision(receivingEntity: IEntity) {
        if (IDTracker.isWall(receivingEntity.id))
            this._wallsForProcessing.push(receivingEntity.id);
    }
}