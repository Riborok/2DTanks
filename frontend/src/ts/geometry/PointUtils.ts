import {Point} from "./Point";

/**
 * A utility class for performing common operations on points.
 */
export class PointUtils {
    private constructor() { }
    /**
     * Adds two points together and returns the result as a new point.
     * @param point1 The first point.
     * @param point2 The second point.
     * @returns A new point representing the sum of the input points.
     */
    public static add(point1: Point, point2: Point): Point {
        return new Point(point1.x + point2.x, point1.y + point2.y);
    }
    /**
     * Subtracts one point from another and returns the result as a new point.
     * @param minuendPoint The point from which to subtract.
     * @param subtrahendPoint The point to subtract.
     * @returns A new point representing the result of the subtraction.
     */
    public static subtract(minuendPoint: Point, subtrahendPoint: Point): Point {
        return new Point(minuendPoint.x - subtrahendPoint.x, minuendPoint.y - subtrahendPoint.y);
    }
    /**
     * Scales a point by a scalar value and returns the result as a new point.
     * @param point The point to scale.
     * @param scalar The scalar value by which to multiply the point's coordinates.
     * @returns A new point representing the scaled coordinates.
     */
    public static scale(point: Point, scalar: number): Point {
        return new Point(point.x * scalar, point.y * scalar);
    }
}