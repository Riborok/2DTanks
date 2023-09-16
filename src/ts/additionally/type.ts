import {Point} from "../geometry/Point";
import {BulletElement} from "../game/elements/BulletElement";

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
    shoot: number
}

export type CollisionResult = {
    collisionPoint: Point;
    overlap: number;
}

export type CollisionPack = {
    collisionPoint: Point,
    id: number
}

export type BulletCollisionData = {
    bulletElement: BulletElement;
    collisionPacks: Iterable<CollisionPack>;
}

export interface IArmor {
    get armorStrength(): number;
    get armor(): number;
}

export interface IHealth {
    get health(): number;
}