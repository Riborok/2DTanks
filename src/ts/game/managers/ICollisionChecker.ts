import {IPolygon} from "../../polygon/IPolygon";
import {ICollisionDetection} from "../../polygon/ICollisionSystem";
import {hasElements} from "../../additionally/additionalFunc";
import {ICollectible} from "../bonuses/ICollectible";

export interface ICollisionChecker<T extends IPolygon> {
    hasCollision(polygon: IPolygon): Iterable<T> | null;
}

export interface GetCollisionDetector<T extends IPolygon> {
    get collisionDetector(): ICollisionChecker<T>;
}

export class CollisionChecker<T extends IPolygon> implements ICollisionChecker<T> {
    private readonly _collisionDetection: ICollisionDetection<T>;
    public constructor(collisionDetection: ICollisionDetection<T>) {
        this._collisionDetection = collisionDetection;
    }
    public hasCollision(polygon: IPolygon): Iterable<T> | null {
        const collectibles = this._collisionDetection.getCollisions(polygon);
        return hasElements(collectibles) ? collectibles : null;
    }
}