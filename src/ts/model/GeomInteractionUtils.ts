import {RectangularEntity} from "./IEntity";
import {Point} from "./Point";

export class GeomInteractionUtils {
    private constructor() { }

    /**
     * Rotates the given point around the target point by a specified angle using sine and cosine values.
     * The function modifies the `point` parameter with the new rotated coordinates.
     * @param point The point to be rotated. Its coordinates will be updated.
     * @param targetPoint The target point around which the rotation will be performed.
     * @param sin The sine value of the rotation angle.
     * @param cos The cosine value of the rotation angle.
     */
    public static rotatePointAroundTarget(point: Point, targetPoint: Point, sin: number, cos: number) {
        const deltaX = point.x - targetPoint.x;
        const deltaY = point.y - targetPoint.y;
        point.x = targetPoint.x + deltaX * cos - deltaY * sin;
        point.y = targetPoint.y + deltaX * sin + deltaY * cos;
    }
    public static isCross(rectangle1: RectangularEntity, rectangle2: RectangularEntity): boolean {
        for (const point of rectangle1.points)
            if (GeomInteractionUtils.isPointInsideRect(point, rectangle2))
                return true;

        for (const point of rectangle2.points)
            if (GeomInteractionUtils.isPointInsideRect(point, rectangle1))
                return true;

        return false;
    }
    public static isPointInsideRect(point: Point, rectangle: RectangularEntity): boolean {
        return (
            (
                ((rectangle.points[0].x < point.x && point.x < rectangle.points[1].x) ||
                    (rectangle.points[0].x > point.x && point.x > rectangle.points[1].x))
                &&
                ((rectangle.points[0].y < point.y && point.y < rectangle.points[2].y) ||
                    (rectangle.points[0].y > point.y && point.y > rectangle.points[2].y))
            )
            ||
            (
                ((rectangle.points[1].x < point.x && point.x < rectangle.points[3].x) ||
                    (rectangle.points[1].x > point.x && point.x > rectangle.points[3].x))
                &&
                ((rectangle.points[1].y < point.y && point.y < rectangle.points[0].y) ||
                    (rectangle.points[1].y > point.y && point.y > rectangle.points[0].y))
            )
        );
    }
}