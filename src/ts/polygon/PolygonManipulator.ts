import {Vector} from "../geometry/Point";
import {IPolygon} from "./IPolygon";
import {PointRotator} from "../geometry/PointRotator";

export class PolygonManipulator {
    private constructor() {}
    /**
     * Move a polygon by a specified vector.
     * @param polygon The polygon to move.
     * @param vector The vector representing the movement.
     */
    public static movePolygon(polygon: IPolygon, vector: Vector) {
        for (const point of polygon.points)
            point.addToCoordinates(vector.x, vector.y);
    }
    /**
     * Rotate a polygon by a specified angle (deltaAngle) around its center point.
     * @param polygon The polygon to rotate.
     * @param deltaAngle The angle by which to rotate the polygon.
     */
    public static rotatePolygon(polygon: IPolygon, deltaAngle: number) {
        const sin = Math.sin(deltaAngle);
        const cos = Math.cos(deltaAngle);
        const center = polygon.calcCenter();

        for (const point of polygon.points)
            PointRotator.rotatePointAroundTarget(point, center, sin, cos);
    }
}