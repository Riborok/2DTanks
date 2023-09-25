import {Point} from "../geometry/Point";
import {BulletElement} from "../game/elements/BulletElement";
import {IEntity} from "../polygon/entity/IEntity";
import {ISprite} from "../sprite/ISprite";
import {IPolygon} from "../polygon/IPolygon";
import {IElement} from "../game/elements/IElement";
import {Bonus} from "../constants/gameConstants";

export type FieldMap<T> = {
    [key: string]: T;
}

export interface IAmmo {
    get source(): IElement;
}

export interface IRulesManager {
    addBonus(source: IElement, bonus: Bonus): boolean;
}

export interface IExecutor {
    handle(deltaTime: number): void;
}

export interface IEventEmitter {
    removeEventListeners(): void;
}

export interface IEntityLifecycle<T extends ISprite, V extends IPolygon> {
    spawn(storage1: IStorage<T>, storage2: IStorage<V>): void;
    terminate(storage1: IStorage<T>, storage2: IStorage<V>): void;
}

export interface ICollisionManager<T> {
    hasCollision(entity: IEntity): Iterable<T> | null;
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