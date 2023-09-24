import {ICollisionDetection} from "../../polygon/IPolygonCollisionSystem";
import {ICollisionManager} from "../../additionally/type";
import {IEntity} from "../../polygon/entity/IEntity";
import {ICollectible} from "./ICollectible";

export class BonusCollisionManager implements ICollisionManager<ICollectible> {
    private readonly _collisionDetection: ICollisionDetection<ICollectible>;
    public constructor(collisionDetection: ICollisionDetection<ICollectible>) {
        this._collisionDetection = collisionDetection;
    }
    public hasCollision(entity: IEntity): Iterable<ICollectible>  {
        return this._collisionDetection.getCollisions(entity);
    }
}