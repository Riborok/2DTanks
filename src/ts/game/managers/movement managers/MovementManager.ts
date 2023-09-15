import {TankElement} from "../../elements/TankElement";
import {ICollisionManager} from "../ICollisionManager";
import {WallElement} from "../../elements/WallElement";
import {IEntity} from "../../../entitiy/IEntity";
import {IStorage} from "../../../entitiy/IEntityCollisionSystem";
import {BulletElement} from "../../elements/BulletElement";
import {IIdToProcessing} from "../IdToProcessing";
import {BulletCollisionData} from "../../../additionally/type";

export type Action = (resistanceCoeff: number, airResistanceCoeff: number, deltaTime: number) => void;
export type Movement = (entity: IEntity) => void;

export abstract class MovementManager {
    protected readonly _entityStorage: IStorage<IEntity>;
    protected readonly _collisionManager: ICollisionManager;
    protected _resistanceCoeff: number = 0;
    protected _airResistanceCoeff: number = 0;
    public set resistanceCoeff(resistanceCoeff: number) { this._resistanceCoeff = resistanceCoeff }
    public set airResistanceCoeff(airResistanceCoeff: number) { this._airResistanceCoeff = airResistanceCoeff }
    public constructor(entityStorage: IStorage<IEntity>, collisionManager: ICollisionManager) {
        this._entityStorage = entityStorage;
        this._collisionManager = collisionManager;
    }
    public get entityStorage(): IStorage<IEntity> { return this._entityStorage }
    public get collisionManager(): ICollisionManager { return this._collisionManager }
}
interface setCoefficients {
    set resistanceCoeff(resistanceCoeff: number);
    set airResistanceCoeff(airResistanceCoefficient: number);
}
export interface ITankMovementManager extends setCoefficients {
    hullCounterclockwiseMovement(tankElement: TankElement, deltaTime: number): void;
    hullClockwiseMovement(tankElement: TankElement, deltaTime: number): void;
    forwardMovement(tankElement: TankElement, deltaTime: number): void;
    backwardMovement(tankElement: TankElement, deltaTime: number): void;
    turretCounterclockwiseMovement(tankElement: TankElement, deltaTime: number): void;
    turretClockwiseMovement(tankElement: TankElement, deltaTime: number): void;
    residualMovement(tankElement: TankElement, deltaTime: number): void;
    residualAngularMovement(tankElement: TankElement, deltaTime: number): void;
}

export interface IWallMovementManager extends setCoefficients {
    hasAnyResidualMovement(wallElement: WallElement): boolean;
    movement(wallElement: WallElement, deltaTime: number): void;
}

export interface IBulletManager extends setCoefficients {
    hasResidualMovement(bulletElement: BulletElement): boolean;
    movement(bulletElement: BulletElement, deltaTime: number): void;
    get bulletAndModelIDs(): IIdToProcessing<BulletCollisionData>;
}