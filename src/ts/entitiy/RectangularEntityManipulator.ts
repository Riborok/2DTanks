import {IEntity} from "./IEntity";
import {Vector} from "../geometry/Point";

/**
 * Class provides utility methods for manipulating rectangular entities.
 */
export class RectangularEntityManipulator {
    private constructor() { }

    /**
     * Move the front part of a rectangular entity based on velocity.
     * The front part includes points 1 and 2.
     * @param entity - The rectangular entity to move.
     * @param velocity - The velocity vector to apply to the front part.
     */
    public static movementFront(entity: IEntity, velocity: Vector) {
        entity.points[1].addToCoordinates(velocity.x, velocity.y);
        entity.points[2].addToCoordinates(velocity.x, velocity.y);
    }
    /**
     * Move the back part of a rectangular entity based on velocity.
     * The back part includes points 0 and 3.
     * @param entity - The rectangular entity to move.
     * @param velocity - The velocity vector to apply to the back part.
     */
    public static movementBack(entity: IEntity, velocity: Vector) {
        entity.points[0].addToCoordinates(velocity.x, velocity.y);
        entity.points[3].addToCoordinates(velocity.x, velocity.y);
    }
}