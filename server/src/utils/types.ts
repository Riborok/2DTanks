import {Point} from "../geometry/Point";
import {Axis} from "../geometry/Point";

export type Size = {
    width: number,
    height: number
};

export type MotionData = {
    finishSpeed: number;
    force: number;
};

export type TankConfig = {
    color: number;
    hullNum: number;
    trackNum: number;
    turretNum: number;
    weaponNum: number;
};

export type CollisionResult = {
    collisionPoint: Point;
    overlap: number;
};

export interface IHealth {
    get health(): number;
    get maxHealth(): number;
}

export interface IArmor {
    get armorStrength(): number;
    get armor(): number;
    get maxArmor(): number;
}

export interface IBulletReceiver {
    get bulletNum(): number;
    takeBullet(bulletNum: number): void;
}

export interface IBulletShooter {
    shot(): any | null;
}

export interface ILandMovement {
    clockwiseMovement(resistanceCoeff: number, airResistanceCoeff: number, deltaTime: number): void;
    counterclockwiseMovement(resistanceCoeff: number, airResistanceCoeff: number, deltaTime: number): void;
    forwardMovement(resistanceCoeff: number, airResistanceCoeff: number, deltaTime: number): void;
    backwardMovement(resistanceCoeff: number, airResistanceCoeff: number, deltaTime: number): void;
}

export interface IStorage<T> {
    insert(t: T): void;
    remove(t: T): void;
    clear(): void;
}

export interface IStaticAxis {
    get axes(): Axis[];
}
