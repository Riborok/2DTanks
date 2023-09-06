import {IEntity} from "../model/entitiy/IEntity";
import {Point} from "../geometry/Point";

export interface IStorage<T> {
    insert(t: T): void;
    remove(t: T): void;
    clear(): void;
}

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

export type CollisionInfo = {
    entity: IEntity,
    collisionResult: CollisionResult;
}

export type CollisionResult = {
    collisionPoint: Point;
    overlap: number;
}