import {IEntity} from "./IEntity";

/**
 * Class provides utility methods for manipulating rectangular entities.
 */
export class RectangularEntityManipulator {
    private constructor() { }

    /**
     * Move the front part of a rectangular entity based on a given displacement.
     * The front part includes points 1 and 2.
     * @param entity - The rectangular entity to move.
     * @param dx - The horizontal displacement to apply to the front part.
     * @param dy - The vertical displacement to apply to the front part.
     */
    public static movementFront(entity: IEntity, dx: number, dy: number) {
        entity.points[1].addToCoordinates(dx, dy);
        entity.points[2].addToCoordinates(dx, dy);
    }
    /**
     * Move the back part of a rectangular entity based on a given displacement.
     * The back part includes points 0 and 3.
     * @param entity - The rectangular entity to move.
     * @param dx - The horizontal displacement to apply to the back part.
     * @param dy - The vertical displacement to apply to the back part.
     */
    public static movementBack(entity: IEntity, dx: number, dy: number) {
        entity.points[0].addToCoordinates(dx, dy);
        entity.points[3].addToCoordinates(dx, dy);
    }
}