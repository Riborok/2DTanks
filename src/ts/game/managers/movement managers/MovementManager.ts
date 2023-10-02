import {TankElement} from "../../elements/TankElement";
import {WallElement} from "../../elements/WallElement";
import {IEntity} from "../../../polygon/entity/IEntity";
import {BulletElement} from "../../elements/BulletElement";
import {IIdToProcessing} from "../IIdToProcessing";
import {BulletCollisionData, IStorage} from "../../../additionally/type";
import {ICollisionResolver} from "../IModelCollisionManager";

export type Action = (resistanceCoeff: number, airResistanceCoeff: number, deltaTime: number) => void;
export type Movement = (entity: IEntity) => void;

interface ISetCoefficients {
    set resistanceCoeff(resistanceCoeff: number);
    set airResistanceCoeff(airResistanceCoefficient: number);
}
interface IEntityControl {
    get entityStorage(): IStorage<IEntity>;
    get collisionResolver(): ICollisionResolver;
}

export abstract class MovementManager implements ISetCoefficients, IEntityControl {
    protected readonly _entityStorage: IStorage<IEntity>;
    protected readonly _collisionResolver: ICollisionResolver;
    protected _resistanceCoeff: number = 0;
    protected _airResistanceCoeff: number = 0;
    public set resistanceCoeff(resistanceCoeff: number) { this._resistanceCoeff = resistanceCoeff }
    public set airResistanceCoeff(airResistanceCoeff: number) { this._airResistanceCoeff = airResistanceCoeff }
    public constructor(entityStorage: IStorage<IEntity>, collisionResolver: ICollisionResolver) {
        this._entityStorage = entityStorage;
        this._collisionResolver = collisionResolver;
    }
    public get entityStorage(): IStorage<IEntity> { return this._entityStorage }
    public get collisionResolver(): ICollisionResolver { return this._collisionResolver }
}

export interface ITankMovementManager {
    counterclockwiseMovement(tankElement: TankElement, deltaTime: number): void;
    clockwiseMovement(tankElement: TankElement, deltaTime: number): void;
    forwardMovement(tankElement: TankElement, deltaTime: number): void;
    backwardMovement(tankElement: TankElement, deltaTime: number): void;
    turretCounterclockwiseMovement(tankElement: TankElement, deltaTime: number): void;
    turretClockwiseMovement(tankElement: TankElement, deltaTime: number): void;
    residualMovement(tankElement: TankElement, deltaTime: number): void;
    residualAngularMovement(tankElement: TankElement, deltaTime: number): void;
}

export interface IWallMovementManager {
    isCompleteMotion(wallElement: WallElement): boolean;
    movement(wallElement: WallElement, deltaTime: number): void;
}

export interface IBulletMovementManager {
    hasResidualMovement(bulletElement: BulletElement): boolean;
    movement(bulletElement: BulletElement, deltaTime: number): void;
    get bulletCollisionDates(): IIdToProcessing<BulletCollisionData>;
    checkForSpawn(bulletElement: BulletElement): boolean;
}