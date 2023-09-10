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
 * Clamps an angle to the specified range, defaulting to [0, 2π).
 * @param angle - The input angle in radians.
 * @param minRange - The minimum angle value of the range (default: 0).
 * @param maxRange - The maximum angle value of the range (default: 2π).
 * @returns The angle clamped within the specified range.
 */
export function clampAngle(angle: number, minRange: number = 0, maxRange: number = 2 * Math.PI): number {
    while (angle < minRange)
        angle += maxRange - minRange;
    while (angle >= maxRange)
        angle -= maxRange - minRange;

    return angle;
}

/**
 * Checks whether an angle is in the 3rd or 4th quadrant.
 * @param angle - The input angle in radians.
 * @returns `true` if the angle is in the 3rd or 4th quadrant, `false` otherwise.
 */
export function isAngleInQuadrant3or4(angle: number): boolean {
    return (angle > Math.PI / 2) && (angle < Math.PI * 3 / 2);
}

/**
 * Calculates the rotation from one angle to another.
 * @param fromAngle - The starting angle in radians.
 * @param toAngle - The target angle in radians.
 * @returns The rotation from `fromAngle` to `toAngle` in radians.
 */
export function calcTurn(fromAngle: number, toAngle: number): number {
    return clampAngle(fromAngle - toAngle);
}