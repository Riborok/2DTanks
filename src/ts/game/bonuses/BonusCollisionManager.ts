import {ICollisionDetection} from "../../polygon/ICollisionSystem";
import {ICollisionManager} from "../../additionally/type";
import {ICollectible} from "./ICollectible";
import {IPolygon} from "../../polygon/IPolygon";
import {hasElements} from "../../additionally/additionalFunc";

export class BonusCollisionManager implements ICollisionManager<ICollectible> {
    private readonly _collisionDetection: ICollisionDetection<ICollectible>;
    public constructor(collisionDetection: ICollisionDetection<ICollectible>) {
        this._collisionDetection = collisionDetection;
    }
    public hasCollision(polygon: IPolygon): Iterable<ICollectible> | null {
        const collectibles = this._collisionDetection.getCollisions(polygon);
        return hasElements(collectibles) ? collectibles : null;
    }
}