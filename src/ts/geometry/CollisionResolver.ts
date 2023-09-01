import {IEntity} from "../model/entitiy/IEntity";
import {CollisionInfo} from "../additionally/type";
import {Vector} from "./Point";

export class CollisionResolver {
    private constructor() {}

    public static resolveCollision(impartingEntity: IEntity, collisionInfo: CollisionInfo) {
        const center = impartingEntity.calcCenter();
        const collisionNormal = new Vector(
            collisionInfo.collisionResult.collisionPoint.x - center.x,
            collisionInfo.collisionResult.collisionPoint.y - center.y
        );
        collisionNormal.normalize();

        const correctionX = collisionNormal.x * collisionInfo.collisionResult.overlap;
        const correctionY = collisionNormal.y * collisionInfo.collisionResult.overlap;
        impartingEntity.points.forEach((point) => {
            point.x -= correctionX;
            point.y -= correctionY;
        });
    }
}