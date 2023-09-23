import {IEntity} from "../../entitiy/entity/IEntity";
import {ICollisionDetection} from "../../entitiy/IEntityCollisionSystem";
import {CollisionResolver} from "../../geometry/CollisionResolver";
import {ModelIDTracker} from "../id/ModelIDTracker";
import {IdToProcessing, IIdToProcessing} from "./IdToProcessing";
import {CollisionPack} from "../../additionally/type";

export interface ICollisionManager {
    hasCollision(entity: IEntity): Iterable<CollisionPack> | null;
    get wallsForProcessing(): IIdToProcessing<number>;
}

export class CollisionManager implements ICollisionManager {
    private readonly _collisionDetection: ICollisionDetection;
    private _wallsForProcessing: IIdToProcessing<number> = new IdToProcessing();
    public get wallsForProcessing(): IIdToProcessing<number> { return this._wallsForProcessing }
    public constructor(collisionDetection: ICollisionDetection) {
        this._collisionDetection = collisionDetection;
    }
    public hasCollision(entity: IEntity): Iterable<CollisionPack> | null {
        const receivingEntities = this._collisionDetection.getCollisions(entity);
        const collisionPacks = new Array<CollisionPack>();

        for (const receivingEntity of receivingEntities) {
            const collisionPoint = CollisionResolver.resolveCollision(entity, receivingEntity);
            if (collisionPoint) {
                collisionPacks.push({collisionPoint: collisionPoint, id: receivingEntity.id});
                this.processCollision(receivingEntity);
            }
        }

        return collisionPacks.length !== 0 ? collisionPacks : null;
    }
    private processCollision(receivingEntity: IEntity) {
        if (ModelIDTracker.isWall(receivingEntity.id))
            this._wallsForProcessing.push(receivingEntity.id);
    }
}