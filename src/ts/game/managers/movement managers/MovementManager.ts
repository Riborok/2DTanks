import {TankElement} from "../../elements/TankElement";
import {ICollisionManager} from "../ICollisionManager";
import {WallElement} from "../../elements/WallElement";
import {IEntity} from "../../../model/entitiy/IEntity";
import {IStorage} from "../../../model/entitiy/IEntityCollisionSystem";
import {BulletElement} from "../../elements/BulletElement";
import {IIdToProcessing} from "../IdToProcessing";

export type Action = (resistanceCoeff: number, airResistanceCoeff: number) => void;

export abstract class MovementManager {
    protected readonly _entityStorage: IStorage<IEntity>;
    protected readonly _collisionManager: ICollisionManager;
    protected _resistanceCoeff: number = 0;
    protected _airResistanceCoeff: number = 0;
    public set resistanceCoeff(resistanceCoeff: number) { this._resistanceCoeff = resistanceCoeff }
    public set airResistanceCoeff(airResistanceCoefficient: number) { this._airResistanceCoeff = airResistanceCoefficient }
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
    hullCounterclockwiseMovement(tankElement: TankElement): void;
    hullClockwiseMovement(tankElement: TankElement): void;
    forwardMovement(tankElement: TankElement): void;
    backwardMovement(tankElement: TankElement): void;
    turretCounterclockwiseMovement(tankElement: TankElement): void;
    turretClockwiseMovement(tankElement: TankElement): void;
    residualMovement(tankElement: TankElement): void;
    residualAngularMovement(tankElement: TankElement): void;
}

export interface IWallMovementManager extends setCoefficients {
    hasAnyResidualMovement(wallElement: WallElement): boolean;
    movement(wallElement: WallElement): void;
}

export interface IBulletManager extends setCoefficients {
    hasResidualMovement(bulletElement: BulletElement): boolean;
    movement(bulletElement: BulletElement): void;
    get bulletAndModelIDs(): IIdToProcessing;
}