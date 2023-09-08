import {Point} from "../geometry/Point";

export type MotionData = {
    finishSpeed: number;
    force: number;
}

export type Control = {
    forwardMask: number,
    backwardMask: number,
    hullClockwiseMask: number,
    hullCounterClockwiseMask: number,
    turretClockwiseMask: number,
    turretCounterClockwiseMask: number,
}

export type CollisionResult = {
    collisionPoint: Point;
    overlap: number;
}