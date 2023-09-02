import {TankElement} from "../elements/TankElement";
import {IEntityStorage} from "../../model/entitiy/IEntityCollisionSystem";
import {ICollisionManager} from "./ICollisionManager";
import {Point} from "../../geometry/Point";

type Action = (resistanceCoeff: number, airResistanceCoeff: number) => void;
type UpdateSprites = (point: Point, hullAngle: number, turretAngle: number) => void;

export interface IMovementManager {
    hullCounterclockwiseMovement(tankElement: TankElement): void;
    hullClockwiseMovement(tankElement: TankElement): void;
    forwardMovement(tankElement: TankElement): void;
    backwardMovement(tankElement: TankElement): void;
    turretCounterclockwiseMovement(tankElement: TankElement): void;
    turretClockwiseMovement(tankElement: TankElement): void;
    residualMovement(tankElement: TankElement): void;
    removeSpriteAccelerationEffect(tankElement: TankElement): void;
    residualAngularMovement(tankElement: TankElement): void;

    set resistanceCoeff(resistanceCoeff: number);
    set airResistanceCoeff(airResistanceCoefficient: number);
}
export class MovementManager implements IMovementManager{
    private readonly _entityStorage: IEntityStorage;
    private readonly _collisionManager: ICollisionManager;
    private _resistanceCoeff: number = 0;
    private _airResistanceCoeff: number = 0
    public set resistanceCoeff(resistanceCoeff: number) { this._resistanceCoeff = resistanceCoeff }
    public set airResistanceCoeff(airResistanceCoefficient: number) { this._airResistanceCoeff = airResistanceCoefficient }
    public constructor(entityStorage: IEntityStorage, collisionManager: ICollisionManager) {
        this._entityStorage = entityStorage;
        this._collisionManager = collisionManager;
    }
    public removeSpriteAccelerationEffect(tankElement: TankElement) {
        const tankSpriteParts = tankElement.sprite.tankSpriteParts;
        tankSpriteParts.bottomSpriteAccelerationEffect.removeAcceleration();
        tankSpriteParts.topSpriteAccelerationEffect.removeAcceleration();
    }
    public residualMovement(tankElement: TankElement) {
        const tankSpriteParts = tankElement.sprite.tankSpriteParts;
        if (tankElement.model.isIdle()) {
            tankSpriteParts.bottomTrackSprite.stopped();
            tankSpriteParts.topTrackSprite.stopped();
        }
        else {
            tankSpriteParts.bottomTrackSprite.setResidualMovement();
            tankSpriteParts.topTrackSprite.setResidualMovement();
            this.hullUpdate(tankElement,
                tankElement.model.residualMovement,
                tankElement.sprite.updateAfterAction
            );
        }
    }
    public residualAngularMovement(tankElement: TankElement) {
        if (!tankElement.model.isAngularMotionStopped()) {
            this.hullUpdate(tankElement,
                tankElement.model.residualAngularMovement,
                tankElement.sprite.updateAfterAction
            );
        }
    }
    public turretCounterclockwiseMovement(tankElement: TankElement) {
        tankElement.model.turretCounterclockwiseMovement();
        MovementManager.turretUpdate(tankElement);
    }
    public turretClockwiseMovement(tankElement: TankElement) {
        tankElement.model.turretClockwiseMovement();
        MovementManager.turretUpdate(tankElement);
    }
    public hullCounterclockwiseMovement(tankElement: TankElement) {
        this.hullUpdate(tankElement, tankElement.model.hullCounterclockwiseMovement, tankElement.sprite.updateAfterAction);
    }
    public hullClockwiseMovement(tankElement: TankElement) {
        this.hullUpdate(tankElement, tankElement.model.hullClockwiseMovement, tankElement.sprite.updateAfterAction);
    }
    public forwardMovement(tankElement: TankElement) {
        this.hullUpdate(tankElement, tankElement.model.forwardMovement, tankElement.sprite.updateForwardAction);
    }
    public backwardMovement(tankElement: TankElement) {
        this.hullUpdate(tankElement, tankElement.model.backwardMovement, tankElement.sprite.updateBackwardAction);
    }
    private hullUpdate(tankElement: TankElement, action: Action, updateSprites: UpdateSprites) {
        const entity = tankElement.model.entity;
        this._entityStorage.remove(entity)
        action.call(tankElement.model, this._resistanceCoeff, this._airResistanceCoeff);
        if (!this._collisionManager.hasCollision(entity))
            this.removeSpriteAccelerationEffect(tankElement);

        updateSprites.call(tankElement.sprite, entity.points[0], entity.angle,
            tankElement.model.tankParts.turret.angle);

        this._entityStorage.insert(entity);
    }
    private static turretUpdate(tankElement: TankElement) {
        const model = tankElement.model;
        const angle = model.entity.angle;
        const hullSin = Math.sin(angle);
        const hullCos = Math.cos(angle);

        tankElement.sprite.rotateTurretUpdate(
            tankElement.sprite.tankSpriteParts.hullSprite.calcPosition(model.entity.points[0], hullSin, hullCos),
            model.tankParts.turret.angle, hullSin, hullCos
        );
    }
}