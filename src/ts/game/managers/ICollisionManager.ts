import {IEntity} from "../../model/entitiy/IEntity";
import {ICollisionDetection} from "../../model/entitiy/IEntityCollisionSystem";
import {CollisionResolver} from "../../geometry/CollisionResolver";
import {IDTracker} from "../id/IDTracker";

class IdToProcessing {
    private readonly _idForProcessing: number[] = new Array<number>();
    public hasWallsForProcessing(): boolean { return this._idForProcessing.length !== 0 }
    public clear() { this._idForProcessing.length = 0 }
    public push(id: number) { this._idForProcessing.push(id) }
    public get iterable(): Iterable<number> { return this._idForProcessing }
}

export interface ICollisionManager {
    hasCollision(entity: IEntity): boolean;
    get wallsForProcessing(): IdToProcessing;
}

export class CollisionManager implements ICollisionManager {
    private readonly _collisionDetection: ICollisionDetection;
    private _wallsForProcessing: IdToProcessing = new IdToProcessing();
    public get wallsForProcessing(): IdToProcessing { return this._wallsForProcessing }
    public constructor(collisionDetection: ICollisionDetection) {
        this._collisionDetection = collisionDetection;
    }
    public hasCollision(entity: IEntity): boolean {
        const receivingEntities = this._collisionDetection.getCollisions(entity);
        let hasCollision: boolean = false;

        for (const receivingEntity of receivingEntities) {
            CollisionResolver.resolveCollision(entity, receivingEntity);
            this.processCollision(receivingEntity);
            hasCollision = true;
        }

        return hasCollision;
    }
    private processCollision(receivingEntity: IEntity) {
        if (this.isWallCollision(receivingEntity))
            this._wallsForProcessing.push(receivingEntity.id);
    }

    private isWallCollision(receivingEntity: IEntity): boolean {
        return (
            receivingEntity.id >= IDTracker.STARTING_WALL_ID &&
            receivingEntity.id <= IDTracker.ENDING_WALL_ID
        );
    }
}