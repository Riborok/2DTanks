import {Point} from "../geometry/Point";

/**
 * Interface representing a polygon with points.
 */
export interface IPolygon {
    get points(): Point[];
}