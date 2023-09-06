import {IEntity} from "../../model/entitiy/IEntity";
import {ICollisionDetection} from "../../model/entitiy/IEntityCollisionSystem";
import {CollisionResolver} from "../../geometry/CollisionResolver";
import {IDTracker} from "../id/IDTracker";
import {CollisionInfo} from "../../additionally/type";
import {ILinkedList, LinkedList} from "../../additionally/ILinkedList";

export interface ICollisionManager {
    hasCollision(entity: IEntity): boolean;
    get wallsForProcessing(): Iterable<number>;
}

export class CollisionManager implements ICollisionManager {
    private readonly _collisionDetection: ICollisionDetection;
    private _wallsForProcessing: ILinkedList<number> = new LinkedList<number>;
    public get wallsForProcessing(): Iterable<number> {
        const result = this._wallsForProcessing;
        this._wallsForProcessing = new LinkedList<number>;
        return result;
    }
    public constructor(collisionDetection: ICollisionDetection) {
        this._collisionDetection = collisionDetection;
    }
    public hasCollision(entity: IEntity): boolean {
        const collisionsInfo = this._collisionDetection.getCollisions(entity);
        let hasCollision: boolean = false;

        for (const collisionInfo of collisionsInfo) {
            CollisionResolver.resolveCollision(entity, collisionInfo);
            this.processCollision(entity, collisionInfo);
            hasCollision = true;
        }

        return hasCollision;
    }
    private processCollision(entity: IEntity, collisionInfo: CollisionInfo) {
        if (this.isWallCollision(collisionInfo))
            this._wallsForProcessing.addToHead(collisionInfo.entity.id);
    }

    private isWallCollision(collisionInfo: CollisionInfo): boolean {
        return (
            collisionInfo.entity.id >= IDTracker.STARTING_WALL_ID &&
            collisionInfo.entity.id <= IDTracker.ENDING_WALL_ID
        );
    }
}