import {Point} from "../geometry/Point";
import {IIdentifiable} from "../game/id/IIdentifiable";

/**
 * Interface representing a polygon with points.
 */
export interface IPolygon extends IIdentifiable {
    get points(): Point[];
    calcCenter(): Point;
}