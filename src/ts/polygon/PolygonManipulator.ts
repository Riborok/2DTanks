import {Vector} from "../geometry/Point";
import {IPolygon} from "./IPolygon";

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
}