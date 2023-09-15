import {PointRotator} from "../geometry/PointRotator";
import {IEntity} from "./IEntity";

/**
 * Class provides utility methods for manipulating entities.
 */
export class EntityManipulator {
    private constructor() { }
    /**
     * Move an entity based on its current velocity.
     * @param entity The entity to move.
     * @warning If the entity moves a distance greater than its own size, it may lead to collision processing errors.
     */
    public static movement(entity: IEntity) {
        for (const point of entity.points)
            point.addToCoordinates(entity.velocity.x, entity.velocity.y);
    }
    /**
     * Rotate an entity based on its current angular velocity.
     * @param entity The entity to rotate.
     * @warning If the entity moves a distance greater than its own size, it may lead to collision processing errors.
     */
    public static angularMovement(entity: IEntity) {
        EntityManipulator.rotateEntity(entity, entity.angularVelocity);
    }
    /**
     * Rotate an entity by a specified angle (deltaAngle) around its center point.
     * @param entity The entity to rotate.
     * @param deltaAngle The angle by which to rotate the entity.
     */
    public static rotateEntity(entity: IEntity, deltaAngle: number) {
        const sin = Math.sin(deltaAngle);
        const cos = Math.cos(deltaAngle);
        const center = entity.calcCenter();

        for (const point of entity.points)
            PointRotator.rotatePointAroundTarget(point, center, sin, cos);
        PointRotator.rotatePoint(entity.velocity, sin, cos);
    }
}