import {IEntity} from "../model/entitiy/IEntity";
import {CollisionInfo} from "../additionally/type";
import {Point, Vector} from "./Point";
import {VectorUtils} from "./VectorUtils";

export class CollisionResolver {
    private constructor() {}
    private static readonly coefficientOfRestitution: number = 0.55;
    public static resolveCollision(impartingEntity: IEntity, collisionInfo: CollisionInfo) {
        const collisionNormal = this.calcCollisionNormal(collisionInfo.collisionResult.collisionPoint,
            impartingEntity.calcCenter());

        this.separateEntities(impartingEntity, collisionInfo, collisionNormal);
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
    private static separateEntities(impartingEntity: IEntity, collisionInfo: CollisionInfo, collisionNormal: Vector) {
        const isReceivingEntityImmovable = this.isImmovable(collisionInfo.entity);
        const totalMass = impartingEntity.mass + (isReceivingEntityImmovable ? 0 : collisionInfo.entity.mass);

        let factor = (1 + impartingEntity.mass / totalMass);
        let correctionX = -collisionNormal.x * collisionInfo.collisionResult.overlap * factor;
        let correctionY = -collisionNormal.y * collisionInfo.collisionResult.overlap * factor;
        for (const point of impartingEntity.points)
            point.addToCoordinates(correctionX, correctionY);

        if (!isReceivingEntityImmovable) {
            factor = (1 + collisionInfo.entity.mass / totalMass);
            correctionX = collisionNormal.x * collisionInfo.collisionResult.overlap * factor;
            correctionY = collisionNormal.y * collisionInfo.collisionResult.overlap * factor;
            for (const point of collisionInfo.entity.points)
                point.addToCoordinates(correctionX, correctionY);
        }
    }
    private static isImmovable(entity: IEntity): boolean { return entity.mass === Infinity }
    private static calcCollisionNormal(collisionPoint: Point, center: Point): Vector {
        const collisionNormal = VectorUtils.subtract(collisionPoint, center);
        collisionNormal.normalize();
        return collisionNormal;
    }
}