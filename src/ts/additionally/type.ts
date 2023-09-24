import {Point} from "../geometry/Point";
import {BulletElement} from "../game/elements/BulletElement";

export interface IEventEmitter {
    removeEventListeners(): void;
}

export interface ICollisionManager<T, V> {
    hasCollision(entity: T): Iterable<V> | null;
}

export interface IStorage<T> {
    insert(t: T): void;
    remove(t: T): void;
    clear(): void;
}

export type Size = {
    width: number,
    height: number
}

export type MotionData = {
    finishSpeed: number;
    force: number;
}

export type Control = {
    forwardKey: number,
    backwardKey: number,
    hullClockwiseKey: number,
    hullCounterClockwiseKey: number,
    turretClockwiseKey: number,
    turretCounterClockwiseKey: number,
    shootKey: number
}

export type CollisionResult = {
    collisionPoint: Point;
    overlap: number;
}

export type ModelCollisionPack = {
    collisionPoint: Point,
    id: number
}

export type BulletCollisionData = {
    bulletElement: BulletElement;
    collisionPacks: Iterable<ModelCollisionPack>;
}

export interface IArmor {
    get armorStrength(): number;
    get armor(): number;
}

export interface IHealth {
    get health(): number;
}