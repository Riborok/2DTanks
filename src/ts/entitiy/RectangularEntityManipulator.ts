import {IEntity} from "./IEntity";

/**
 * Class provides utility methods for manipulating rectangular entities.
 */
export class RectangularEntityManipulator {
    private constructor() { }

    /**
     * Move the front part of a rectangular entity based on its current velocity.
     * The front part includes points 1 and 2.
     * @param entity The rectangular entity to move.
     */
    public static movementFront(entity: IEntity) {
        entity.points[1].addToCoordinates(entity.velocity.x, entity.velocity.y);
        entity.points[2].addToCoordinates(entity.velocity.x, entity.velocity.y);
    }
    /**
     * Move the back part of a rectangular entity based on its current velocity.
     * The back part includes points 0 and 3.
     * @param entity The rectangular entity to move.
     */
    public static movementBack(entity: IEntity) {
        entity.points[0].addToCoordinates(entity.velocity.x, entity.velocity.y);
        entity.points[3].addToCoordinates(entity.velocity.x, entity.velocity.y);
    }
}