import {ICollisionDetection} from "../../polygon/IPolygonCollisionSystem";
import {IBonus} from "./IBonus";
import {ICollisionManager} from "../../additionally/type";
import {IEntity} from "../../polygon/entity/IEntity";
import {hasElements} from "../../additionally/additionalFunc";

export class BonusCollisionManager implements ICollisionManager<IBonus> {
    private readonly _collisionDetection: ICollisionDetection<IBonus>;
    public constructor(collisionDetection: ICollisionDetection<IBonus>) {
        this._collisionDetection = collisionDetection;
    }
    public hasCollision(entity: IEntity): Iterable<IBonus> | null {
        const bonuses = this._collisionDetection.getCollisions(entity);
        return hasElements(bonuses) ? bonuses : null;
    }
}