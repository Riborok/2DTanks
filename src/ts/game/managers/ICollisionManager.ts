import {IEntity} from "../../model/entitiy/IEntity";
import {ICollisionDetection} from "../../model/entitiy/IEntityCollisionSystem";
import {CollisionResolver} from "../../geometry/CollisionResolver";
import {DoubleLinkedList} from "../../additionally/DoubleLinkedList";
import {IDTracker} from "../id/IDTracker";

export interface ICollisionManager {
    hasCollision(entity: IEntity): boolean;
}

export class CollisionManager implements ICollisionManager {
    private readonly _collisionDetection: ICollisionDetection;
    private readonly _elementsToProcess: DoubleLinkedList<number> = new DoubleLinkedList<number>;
    public get elementsToProcess(): DoubleLinkedList<number> { return this._elementsToProcess }
    public constructor(collisionDetection: ICollisionDetection) {
        this._collisionDetection = collisionDetection;
    }
    public hasCollision(entity: IEntity) : boolean {
        const collisionsInfo = this._collisionDetection.getCollisions(entity);

         for (const collisionInfo of collisionsInfo) {
             CollisionResolver.resolveCollision(entity, collisionInfo);
             if (collisionInfo.entity.id >= IDTracker.STARTING_WALL_ID)
                 this._elementsToProcess.addToHead(collisionInfo.entity.id);
         }

        return collisionsInfo.length === 0;
    }
}