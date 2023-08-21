import {RectangularEntity} from "./IEntity";
import {Point} from "./Point";

export class GeomInteractionUtils {
    private constructor() { }

    public static rotatePointAroundTarget(point: Point, targetPoint: Point, deltaAngle: number) {
        const deltaX = point.x - targetPoint.x;
        const deltaY = point.y - targetPoint.y;
        point.x = targetPoint.x + deltaX * Math.cos(deltaAngle) - deltaY * Math.sin(deltaAngle);
        point.y = targetPoint.y + deltaX * Math.sin(deltaAngle) + deltaY * Math.cos(deltaAngle);
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