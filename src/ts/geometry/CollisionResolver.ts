import {IEntity} from "../model/entitiy/IEntity";
import {CollisionInfo} from "../additionally/type";
import {Vector} from "./Point";
import {VectorUtils} from "./VectorUtils";

export class CollisionResolver {
    private constructor() {}
    private static readonly coefficientOfRestitution: number = 0.65;
    public static resolveCollision(impartingEntity: IEntity, collisionInfo: CollisionInfo) {
        const center = impartingEntity.calcCenter();
        const collisionNormal = new Vector(
            collisionInfo.collisionResult.collisionPoint.x - center.x,
            collisionInfo.collisionResult.collisionPoint.y - center.y
        );
        collisionNormal.normalize();
        this.separateEntities(impartingEntity, collisionInfo, collisionNormal);
        this.updateVelocity(impartingEntity, collisionInfo, collisionNormal);
    }
    private static updateVelocity(impartingEntity: IEntity, collisionInfo: CollisionInfo, collisionNormal: Vector) {
        const relativeVelocity = VectorUtils.subtract(impartingEntity.velocity, collisionInfo.entity.velocity);

        const impulseMagnitude = VectorUtils.dotProduct(relativeVelocity, collisionNormal) * 2 /
            (impartingEntity.mass + collisionInfo.entity.mass) * this.coefficientOfRestitution;

        const impulse1 = VectorUtils.scale(collisionNormal, -impulseMagnitude * impartingEntity.mass);
        const impulse2 = VectorUtils.scale(collisionNormal, impulseMagnitude * collisionInfo.entity.mass);

        impartingEntity.velocity.addVector(impulse1);
        if (collisionInfo.entity.mass !== 0)
            collisionInfo.entity.velocity.addVector(impulse2);
    }
    private static separateEntities(impartingEntity: IEntity, collisionInfo: CollisionInfo, collisionNormal: Vector) {
        const totalMass = impartingEntity.mass + collisionInfo.entity.mass;

        let factor = (1 + impartingEntity.mass / totalMass);
        let correctionX = -collisionNormal.x * collisionInfo.collisionResult.overlap * factor;
        let correctionY = -collisionNormal.y * collisionInfo.collisionResult.overlap * factor;
        for (const point of impartingEntity.points)
            point.addToCoordinates(correctionX, correctionY);

        if (collisionInfo.entity.mass !== 0) {
            factor = (1 + collisionInfo.entity.mass / totalMass);
            correctionX = collisionNormal.x * collisionInfo.collisionResult.overlap * factor;
            correctionY = collisionNormal.y * collisionInfo.collisionResult.overlap * factor;
            for (const point of collisionInfo.entity.points)
                point.addToCoordinates(correctionX, correctionY);
        }
    }
}