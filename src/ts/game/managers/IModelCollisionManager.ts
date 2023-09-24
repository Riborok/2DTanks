import {IEntity} from "../../polygon/entity/IEntity";
import {ICollisionDetection} from "../../polygon/ICollisionSystem";
import {CollisionResolver} from "../../geometry/CollisionResolver";
import {ModelIDTracker} from "../id/ModelIDTracker";
import {IdToProcessing, IIdToProcessing} from "./IdToProcessing";
import {CollisionPack, ICollisionManager} from "../../additionally/type";

export interface IdleModelProvider {
    get wallsForProcessing(): IIdToProcessing<number>;
}

export interface IModelCollisionManager extends IdleModelProvider, ICollisionManager<CollisionPack> {
}

export class ModelCollisionManager implements IModelCollisionManager {
    private readonly _collisionDetection: ICollisionDetection<IEntity>;
    private _wallsForProcessing: IIdToProcessing<number> = new IdToProcessing();
    public get wallsForProcessing(): IIdToProcessing<number> { return this._wallsForProcessing }
    public constructor(collisionDetection: ICollisionDetection<IEntity>) {
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