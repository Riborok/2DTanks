import {RectangularEntity} from "./IEntity";
import {Point} from "./Point";

export class CollisionUtils {
    private constructor() { }
    public static isCross(rectangle1: RectangularEntity, rectangle2: RectangularEntity): boolean {
        for (const point of rectangle1.points)
            if (CollisionUtils.isPointInsideRect(point, rectangle2))
                return true;

        for (const point of rectangle2.points)
            if (CollisionUtils.isPointInsideRect(point, rectangle1))
                return true;

        return false;
    }
    private static isPointInsideRect(point: Point, rectangle: RectangularEntity): boolean {
        return (
            (
                ((rectangle.points[0].x <= point.x && point.x <= rectangle.points[1].x) ||
                    (rectangle.points[0].x >= point.x && point.x >= rectangle.points[1].x))
                &&
                ((rectangle.points[0].y <= point.y && point.y <= rectangle.points[2].y) ||
                    (rectangle.points[0].y >= point.y && point.y >= rectangle.points[2].y))
            )
            ||
            (
                ((rectangle.points[1].x <= point.x && point.x <= rectangle.points[3].x) ||
                    (rectangle.points[1].x >= point.x && point.x >= rectangle.points[3].x))
                &&
                ((rectangle.points[1].y <= point.y && point.y <= rectangle.points[0].y) ||
                    (rectangle.points[1].y >= point.y && point.y >= rectangle.points[0].y))
            )
        );
    }
}