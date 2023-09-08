import {IEntity} from "../../model/entitiy/IEntity";
import {ICollisionDetection} from "../../model/entitiy/IEntityCollisionSystem";
import {CollisionResolver} from "../../geometry/CollisionResolver";
import {IDTracker} from "../id/IDTracker";
import {ILinkedList, LinkedList} from "../../additionally/data structures/ILinkedList";

export interface ICollisionManager {
    hasCollision(entity: IEntity): boolean;
    getWallsForProcessing(): Iterable<number>;
    hasWallsForProcessing(): boolean;
}

export class CollisionManager implements ICollisionManager {
    private readonly _collisionDetection: ICollisionDetection;
    private _wallsForProcessing: ILinkedList<number> = new LinkedList<number>;
    public getWallsForProcessing(): Iterable<number> {
        const result = this._wallsForProcessing;
        this._wallsForProcessing = new LinkedList<number>;
        return result;
    }
    public hasWallsForProcessing(): boolean { return !this._wallsForProcessing.isEmpty() }
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
            this._wallsForProcessing.addToHead(receivingEntity.id);
    }

    private isWallCollision(receivingEntity: IEntity): boolean {
        return (
            receivingEntity.id >= IDTracker.STARTING_WALL_ID &&
            receivingEntity.id <= IDTracker.ENDING_WALL_ID
        );
    }
}