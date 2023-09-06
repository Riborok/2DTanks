import {IEntity} from "../../model/entitiy/IEntity";
import {ICollisionDetection} from "../../model/entitiy/IEntityCollisionSystem";
import {CollisionResolver} from "../../geometry/CollisionResolver";
import {DoubleLinkedList} from "../../additionally/DoubleLinkedList";
import {IDTracker} from "../id/IDTracker";
import {CollisionInfo} from "../../additionally/type";

export interface ICollisionManager {
    hasCollision(entity: IEntity): boolean;
    get wallsForProcessing(): DoubleLinkedList<number>;
}

export class CollisionManager implements ICollisionManager {
    private readonly _collisionDetection: ICollisionDetection;
    private readonly _wallsForProcessing: DoubleLinkedList<number> = new DoubleLinkedList<number>;
    public get wallsForProcessing(): DoubleLinkedList<number> { return this._wallsForProcessing }
    public constructor(collisionDetection: ICollisionDetection) {
        this._collisionDetection = collisionDetection;
    }
    public hasCollision(entity: IEntity): boolean {
        const collisionsInfo = this._collisionDetection.getCollisions(entity);

        for (const collisionInfo of collisionsInfo) {
            CollisionResolver.resolveCollision(entity, collisionInfo);
            this.processCollision(entity, collisionInfo);
        }

        return collisionsInfo.length === 0;
    }
    private processCollision(entity: IEntity, collisionInfo: CollisionInfo) {
        if (this.isWallCollision(collisionInfo))
            this._wallsForProcessing.addToTail(collisionInfo.entity.id);
    }

    private isWallCollision(collisionInfo: CollisionInfo): boolean {
        return (
            collisionInfo.entity.id >= IDTracker.STARTING_WALL_ID &&
            collisionInfo.entity.id <= IDTracker.ENDING_WALL_ID
        );
    }
}