import {IEntity} from "../model/entitiy/IEntity";
import {Point} from "../geometry/Point";

export type MotionData = {
    finishSpeed: number;
    force: number;
}

export type CollisionPack = {
    entity: IEntity,
    collisionPoint: Point
}

export type Control = {
    forwardMask: number,
    backwardMask: number,
    hullClockwiseMask: number,
    hullCounterClockwiseMask: number,
    turretClockwiseMask: number,
    turretCounterClockwiseMask: number,
}