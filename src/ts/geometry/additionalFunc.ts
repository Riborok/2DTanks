import {Point} from "./Point";

/**
 * Calculates the Euclidean distance between two points in a 2D space.
 * @param point1 - The first point with x and y coordinates.
 * @param point2 - The second point with x and y coordinates.
 * @returns The Euclidean distance between the two points.
 */
export function calcDistance(point1: Point, point2: Point) {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Clamps an angle to the specified range, defaulting to [-2π, 2π].
 * @param angle - The input angle in radians.
 * @param minRange - The minimum angle value of the range (default: -2π).
 * @param maxRange - The maximum angle value of the range (default: 2π).
 * @returns The angle clamped within the specified range.
 */
export function clampAngle(angle: number, minRange: number = -2 * Math.PI, maxRange: number = 2 * Math.PI): number {
    while (angle < minRange)
        angle += maxRange - minRange;
    while (angle >= maxRange)
        angle -= maxRange - minRange;

    return angle;
}