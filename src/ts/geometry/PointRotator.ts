import {Point} from "./Point";

/**
 * A utility class for rotating a point around a target point using sine and cosine values.
 */
export class PointRotator {
    private constructor() { }
    /**
     * Rotates a point around a target point by a given sine and cosine.
     * @param point The point to rotate.
     * @param targetPoint The target point to rotate around.
     * @param sin The sine of the rotation angle.
     * @param cos The cosine of the rotation angle.
     */
    public static rotatePointAroundTarget(point: Point, targetPoint: Point, sin: number, cos: number) {
        const deltaX = point.x - targetPoint.x;
        const deltaY = point.y - targetPoint.y;
        point.x = targetPoint.x + deltaX * cos - deltaY * sin;
        point.y = targetPoint.y + deltaX * sin + deltaY * cos;
    }
    /**
     * Rotates a point by a given sine and cosine.
     * @param point The point to rotate.
     * @param sin The sine of the rotation angle.
     * @param cos The cosine of the rotation angle.
     */
    public static rotatePoint(point: Point, sin: number, cos: number) {
        const x = point.x, y = point.y;
        point.x = x * cos - y * sin;
        point.y = x * sin + y * cos;
    }
}