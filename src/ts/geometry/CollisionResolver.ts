import {IEntity} from "../model/entitiy/IEntity";
import {CollisionInfo} from "../additionally/type";
import {Point, Vector} from "./Point";
import {VectorUtils} from "./VectorUtils";

export class CollisionResolver {
    private constructor() {}
    private static readonly coefficientOfRestitution: number = 0.6;
    public static resolveCollision(impartingEntity: IEntity, collisionInfo: CollisionInfo) {
        const collisionNormal = this.calcCollisionNormal(collisionInfo.collisionResult.collisionPoint,
            impartingEntity.calcCenter());

        this.separateEntities(impartingEntity, collisionInfo.collisionResult.overlap, collisionNormal);
        this.updateVelocity(impartingEntity, collisionInfo.entity, collisionNormal);
    }
    private static updateVelocity(impartingEntity: IEntity, receivingEntity: IEntity, collisionNormal: Vector) {
        const relativeVelocity = VectorUtils.subtract(impartingEntity.velocity, receivingEntity.velocity);

        const impulseMagnitude = VectorUtils.dotProduct(relativeVelocity, collisionNormal) * 2 /
            (1 / impartingEntity.mass + 1 / receivingEntity.mass) * this.coefficientOfRestitution;

        let newImpulse = VectorUtils.scale(collisionNormal, -impulseMagnitude / impartingEntity.mass);
        impartingEntity.velocity.addVector(newImpulse);

        newImpulse = VectorUtils.scale(collisionNormal, impulseMagnitude / receivingEntity.mass);
        receivingEntity.velocity.addVector(newImpulse);
    }
    private static separateEntities(impartingEntity: IEntity, overlap: number, collisionNormal: Vector) {
        let correctionX = -collisionNormal.x * overlap;
        let correctionY = -collisionNormal.y * overlap;
        for (const point of impartingEntity.points)
            point.addToCoordinates(correctionX, correctionY);
    }
    private static calcCollisionNormal(collisionPoint: Point, center: Point): Vector {
        const collisionNormal = VectorUtils.subtract(collisionPoint, center);
        collisionNormal.normalize();
        return collisionNormal;
    }
}