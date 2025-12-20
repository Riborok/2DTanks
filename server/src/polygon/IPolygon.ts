import {Point} from "../geometry/Point";

export interface IPolygon {
    get id(): number;
    get points(): Point[];
    get angle(): number;
    calcCenter(): Point;
}

export interface IPolygonAdjustable {
    adjustPolygon(point: Point, width: number, height: number, angle: number): void;
}


