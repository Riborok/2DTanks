import {Point} from "../geometry/Point";
import {IIdentifiable} from "../game/id/IIdentifiable";

/**
 * Interface representing a polygon with points.
 */
export interface IPolygon extends IIdentifiable {
    get points(): Point[];
    get angle(): number;
    calcCenter(): Point;
}

export interface IPolygonAdjustable {
    adjustPolygon(point: Point, width: number, height: number, angle: number): void;
}
