import {TankElement} from "../../elements/TankElement";
import {IEntityStorage} from "../../../model/entitiy/IEntityCollisionSystem";
import {ICollisionManager} from "../ICollisionManager";
import {WallElement} from "../../elements/WallElement";

export type Action = (resistanceCoeff: number, airResistanceCoeff: number) => void;

export abstract class MovementManager {
    protected readonly _entityStorage: IEntityStorage;
    protected readonly _collisionManager: ICollisionManager;
    protected _resistanceCoeff: number = 0;
    protected _airResistanceCoeff: number = 0;
    public set resistanceCoeff(resistanceCoeff: number) { this._resistanceCoeff = resistanceCoeff }
    public set airResistanceCoeff(airResistanceCoefficient: number) { this._airResistanceCoeff = airResistanceCoefficient }
    public constructor(entityStorage: IEntityStorage, collisionManager: ICollisionManager) {
        this._entityStorage = entityStorage;
        this._collisionManager = collisionManager;
    }
    get entityStorage(): IEntityStorage { return this._entityStorage }
    get collisionManager(): ICollisionManager { return this._collisionManager }
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
    removeSpriteAccelerationEffect(tankElement: TankElement): void;
}

export interface IWallMovementManager extends setCoefficients {
    hasAnyResidualMovement(wallElement: WallElement): boolean;
}