import {Point} from "./Point";

export class PointUtils {
    private constructor() { }

    public static add(point1: Point, point2: Point): Point {
        return new Point(point1.x + point2.x, point1.y + point2.y);
    }
    public static subtract(minuendPoint: Point, subtrahendPoint: Point): Point {
        return new Point(minuendPoint.x - subtrahendPoint.x, minuendPoint.y - subtrahendPoint.y);
    }
    public static scale(point: Point, scalar: number): Point {
        return new Point(point.x * scalar, point.y * scalar);
    }
}