import {IEntity} from "../../polygon/entity/IEntity";
import {ICollisionDetection} from "../../polygon/ICollisionSystem";
import {CollisionResolver} from "../../geometry/CollisionResolver";
import {ModelIDTracker} from "../id/ModelIDTracker";
import {IdToProcessing, IIdToProcessing} from "./IdToProcessing";
import {CollisionPack} from "../../additionally/type";
import {CollisionChecker, GetCollisionChecker, ICollisionChecker} from "./ICollisionChecker";

export interface ICollisionResolver {
    resolveCollision(entity: IEntity): Iterable<CollisionPack> | null;
}
export interface IdleModelProvider {
    get wallsForProcessing(): IIdToProcessing<number>;
}

export interface IModelCollisionManager extends IdleModelProvider, ICollisionResolver, GetCollisionChecker<IEntity> {
}

export class ModelCollisionManager implements IModelCollisionManager {
    private readonly _collisionDetector: ICollisionChecker<IEntity>;
    private _wallsForProcessing: IIdToProcessing<number> = new IdToProcessing();
    public get wallsForProcessing(): IIdToProcessing<number> { return this._wallsForProcessing }
    public get collisionChecker(): ICollisionChecker<IEntity> { return this._collisionDetector }
    public constructor(collisionDetection: ICollisionDetection<IEntity>) {
        this._collisionDetector = new CollisionChecker(collisionDetection);
    }
    public resolveCollision(entity: IEntity): Iterable<CollisionPack> | null {
        const collisions = this._collisionDetector.hasCollision(entity);
        if (collisions) {
            const collisionPacks = new Array<CollisionPack>();

            for (const receivingEntity of collisions) {
                const collisionPoint = CollisionResolver.resolveCollision(entity, receivingEntity);
                if (collisionPoint) {
                    collisionPacks.push({collisionPoint: collisionPoint, id: receivingEntity.id});
                    this.processCollision(receivingEntity);
                }
            }
            return collisionPacks;
        }
        return null;
    }
    private processCollision(receivingEntity: IEntity) {
        if (ModelIDTracker.isWall(receivingEntity.id))
            this._wallsForProcessing.push(receivingEntity.id);
    }
}