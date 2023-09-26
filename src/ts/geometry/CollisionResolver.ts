import {IEntity} from "../polygon/entity/IEntity";
import {Point, Vector} from "./Point";
import {VectorUtils} from "./VectorUtils";
import {CollisionDetector} from "./CollisionDetector";
import {calcTurn, clampAngle, isAngleInQuadrant2or3} from "./additionalFunc";

/**
 * Utility class for resolving collisions between entities.
 */
export class CollisionResolver {
    private constructor() {}
    private static readonly RETENTION_IMPULSE_COEFFICIENT: number = 0.6;
    private static readonly RETENTION_ANGULAR_IMPULSE_COEFFICIENT: number = 0.012;

    private static readonly CORRECTION_FACTOR: number = 0.6;
    private static readonly SMALL_ANGULAR_VELOCITY: number = 0.001;

    /**
     * Resolves a collision between two entities by calculating changes in velocity and angular velocity
     * and separating overlapping entities.
     * @param impartingEntity The entity that caused the collision.
     * @param receivingEntity The entity that received the collision.
     */
    public static resolveCollision(impartingEntity: IEntity, receivingEntity: IEntity): Point | null{
        const collisionResult = CollisionDetector.getCollisionResult(impartingEntity, receivingEntity);
        if (collisionResult === null)
            return null;

        const collisionNormal = this.calcCollisionNormal(collisionResult.collisionPoint,
            impartingEntity.calcCenter());
        const impulseMagnitude = this.calcImpulseMagnitude(impartingEntity, receivingEntity, collisionNormal) +
            this.calcAngularImpulseMagnitude(impartingEntity, receivingEntity);

        this.separateEntities(impartingEntity, collisionResult.overlap, collisionNormal);
        this.updateAngularVelocity(impartingEntity, receivingEntity, collisionResult.collisionPoint, impulseMagnitude, collisionNormal);
        this.updateVelocity(impartingEntity, receivingEntity, impulseMagnitude, collisionNormal);

        return collisionResult.collisionPoint;
    }
    private static updateAngularVelocity(impartingEntity: IEntity, receivingEntity: IEntity, collisionPoint: Point,
                                         impulseMagnitude: number, collisionNormal: Vector) {
        const impartingNormal = this.calcEntityNormal(impartingEntity);

        const radiusReceiving = VectorUtils.subtract(collisionPoint, receivingEntity.calcCenter());
        const radiusImparting = VectorUtils.subtract(collisionPoint, impartingEntity.calcCenter());

        const torqueReceiving = VectorUtils.crossProduct(radiusReceiving, collisionNormal) * impulseMagnitude;
        const torqueImparting = VectorUtils.crossProduct(radiusImparting, impartingNormal) * impulseMagnitude;

        const receivingImpulse = torqueReceiving / receivingEntity.momentOfInertia;
        let impartingImpulse = torqueImparting  / impartingEntity.momentOfInertia;
        if (this.shouldReverseReceiving(receivingEntity.angle, impartingNormal.angle))
            impartingImpulse = -impartingImpulse;

        receivingEntity.angularVelocity += receivingImpulse;
        impartingEntity.angularVelocity += impartingImpulse;
    }
    private static shouldReverseReceiving(receivingAngle: number, impartingNormalAngle: number): boolean {
        const turn = clampAngle(receivingAngle - impartingNormalAngle, 0, Math.PI);
        return (turn < Math.PI / 2 && turn > Math.PI / 4)
            ||
            (turn >= Math.PI / 2 && turn < Math.PI * 3 / 4);
    }
    private static calcEntityNormal(entity: IEntity): Vector {
        const angle = entity.angle;

        return isAngleInQuadrant2or3(calcTurn(angle, entity.velocity.angle))
            ? new Vector(-Math.cos(angle), -Math.sin(angle))
            : new Vector(Math.cos(angle), Math.sin(angle));
    }
    private static updateVelocity(impartingEntity: IEntity, receivingEntity: IEntity, impulseMagnitude: number,
                                  collisionNormal: Vector) {
        const impartingImpulse = VectorUtils.scale(collisionNormal, -impulseMagnitude / impartingEntity.mass);
        const receivingImpulse = VectorUtils.scale(collisionNormal, impulseMagnitude / receivingEntity.mass);

        impartingEntity.velocity.addVector(impartingImpulse);
        receivingEntity.velocity.addVector(receivingImpulse);
    }
    private static separateEntities(impartingEntity: IEntity, overlap: number, collisionNormal: Vector) {
        let correctionX = -collisionNormal.x * overlap;
        let correctionY = -collisionNormal.y * overlap;

        correctionX += Math.sign(correctionX) === 1 ? this.CORRECTION_FACTOR : -this.CORRECTION_FACTOR;
        correctionY += Math.sign(correctionY) === 1 ? this.CORRECTION_FACTOR : -this.CORRECTION_FACTOR;

        for (const point of impartingEntity.points)
            point.addToCoordinates(correctionX, correctionY);

        if (Math.abs(impartingEntity.angularVelocity) > this.SMALL_ANGULAR_VELOCITY)
            impartingEntity.angularVelocity -= Math.sign(impartingEntity.angularVelocity) === 1
                ? this.CORRECTION_FACTOR / impartingEntity.momentOfInertia
                : -this.CORRECTION_FACTOR / impartingEntity.momentOfInertia;
    }
    private static calcImpulseMagnitude(impartingEntity: IEntity, receivingEntity: IEntity, collisionNormal: Vector) {
        const relativeVelocity = VectorUtils.subtract(impartingEntity.velocity, receivingEntity.velocity);

        return  VectorUtils.dotProduct(relativeVelocity, collisionNormal) * 2 /
            (1 / impartingEntity.mass + 1 / receivingEntity.mass) * this.RETENTION_IMPULSE_COEFFICIENT;
    }
    private static calcAngularImpulseMagnitude(impartingEntity: IEntity, receivingEntity: IEntity): number {
        return (impartingEntity.angularVelocity - receivingEntity.angularVelocity) /
            (1 / impartingEntity.momentOfInertia + 1 / receivingEntity.momentOfInertia) * this.RETENTION_ANGULAR_IMPULSE_COEFFICIENT;
    }
    private static calcCollisionNormal(collisionPoint: Point, center: Point): Vector {
        const collisionNormal = VectorUtils.subtract(collisionPoint, center);
        collisionNormal.normalize();
        return collisionNormal;
    }
}