import {IEntity} from "../model/entitiy/IEntity";
import {Point, Vector} from "./Point";
import {VectorUtils} from "./VectorUtils";
import {CollisionDetector} from "./CollisionDetector";

export class CollisionResolver {
    private constructor() {}
    private static readonly coefficientOfRestitution: number = 0.6;
    private static readonly CORRECTION_FACTOR: number = 1.5;
    public static resolveCollision(impartingEntity: IEntity, receivingEntity: IEntity) {
        const collisionResult = CollisionDetector.getCollisionResult(impartingEntity, receivingEntity);
        if (collisionResult === null)
            return;

        const collisionNormal = this.calcCollisionNormal(collisionResult.collisionPoint,
            impartingEntity.calcCenter());

        this.separateEntities(impartingEntity, collisionResult.overlap, collisionNormal);
        this.updateVelocity(impartingEntity, receivingEntity, collisionNormal);
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
        const correctionX = -collisionNormal.x * overlap * this.CORRECTION_FACTOR;
        const correctionY = -collisionNormal.y * overlap * this.CORRECTION_FACTOR;
        for (const point of impartingEntity.points)
            point.addToCoordinates(correctionX, correctionY);
    }
    private static calcCollisionNormal(collisionPoint: Point, center: Point): Vector {
        const collisionNormal = VectorUtils.subtract(collisionPoint, center);
        collisionNormal.normalize();
        return collisionNormal;
    }
}