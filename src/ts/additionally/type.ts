import {Axis, Point} from "../geometry/Point";
import {BulletElement} from "../game/elements/BulletElement";
import {ISprite} from "../sprite/ISprite";
import {IPolygon} from "../polygon/IPolygon";
import {IElement} from "../game/elements/IElement";
import {Bonus} from "../constants/gameConstants";
import {IBulletModel} from "../model/bullet/IBulletModel";

export interface IBulletReceiver {
    get bulletNum(): number;
    takeBullet(bulletNum: number): void;
}

export interface IBulletShooter {
    shot(): IBulletModel | null;
}

export interface ILandMovement {
    clockwiseMovement(resistanceCoeff: number, airResistanceCoeff: number, deltaTime: number): void;
    counterclockwiseMovement(resistanceCoeff: number, airResistanceCoeff: number, deltaTime: number): void;
    forwardMovement(resistanceCoeff: number, airResistanceCoeff: number, deltaTime: number): void;
    backwardMovement(resistanceCoeff: number, airResistanceCoeff: number, deltaTime: number): void;
}

export interface IPositionAdjustable {
    adjustPosition(point: Point, angle: number): void;
}

export type TankInfo = {
    color: number;
    hullNum: number;
    trackNum: number;
    turretNum: number;
    weaponNum: number;
    control: Control;
};

export type FieldMap<T> = {
    [key: string]: T;
}

export interface IAmmo {
    get source(): IElement;
}

export interface IBonusManager {
    addBonus(source: IElement, bonus: Bonus): boolean;
}

export interface IKillProcessor {
    processKill(murderer: IElement, victim: IElement): void;
}
export interface IRulesManager extends IKillProcessor, IBonusManager{
}

export interface IExecutor {
    handle(deltaTime: number): void;
}

export interface IEventEmitter {
    addEventListeners(): void;
    removeEventListeners(): void;
}

export interface IEntityLifecycle<T extends ISprite, V extends IPolygon> {
    spawn(storage1: IStorage<T>, storage2: IStorage<V>): void;
    terminate(storage1: IStorage<T>, storage2: IStorage<V>): void;
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
    get maxArmor(): number;
}
export function isImplementsIArmor(obj: any): obj is IArmor{
    return (
        'armor' in obj &&
        'armorStrength' in obj &&
        'maxArmor' in obj
    );
}

export interface IHealth {
    get health(): number;
    get maxHealth(): number;
}

export interface IStaticAxis {
    get axes(): Axis[];
}