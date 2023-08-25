import {TankElement} from "./TankElement";
import {IEntityStorage} from "../model/IEntityStorage";
import {ICollisionManager} from "./ICollisionManager";
import {TrigCache} from "../additionally/LRUCache";
import {Point} from "../model/Point";
import {GRAVITY_ACCELERATION} from "../constants/gameConstants";

type Action = (resistanceCoefficient: number) => void;
type UpdateSprites = (point: Point, hullAngle: number, turretAngle: number) => void;

export interface IMovementManager {
    hullCounterclockwiseMovement(tankElement: TankElement): void;
    hullClockwiseMovement(tankElement: TankElement): void;
    forwardMovement(tankElement: TankElement): void;
    backwardMovement(tankElement: TankElement): void;
    turretCounterclockwiseMovement(tankElement: TankElement): void;
    turretClockwiseMovement(tankElement: TankElement): void;
    residualMovement(tankElement: TankElement): void;
    setResistanceForce(resistanceCoeff: number): void;
    removeSpriteAccelerationEffect(tankElement: TankElement): void;
}
export class MovementManager implements IMovementManager{
    private readonly _entityStorage: IEntityStorage;
    private readonly _collisionManager: ICollisionManager;
    private _resistanceForce: number = 0;
    public setResistanceForce(resistanceCoeff: number) { this._resistanceForce = resistanceCoeff * GRAVITY_ACCELERATION }
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
                tankElement.model.rollback,
                tankElement.sprite.updateSprite
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
        this.hullUpdate(tankElement, tankElement.model.hullCounterclockwiseMovement,
            tankElement.model.hullClockwiseMovement, tankElement.sprite.updateSprite);
    }
    public hullClockwiseMovement(tankElement: TankElement) {
        this.hullUpdate(tankElement, tankElement.model.hullClockwiseMovement,
            tankElement.model.hullCounterclockwiseMovement, tankElement.sprite.updateSprite);
    }
    public forwardMovement(tankElement: TankElement) {
        this.hullUpdate(tankElement, tankElement.model.forwardMovement, tankElement.model.rollback,
            tankElement.sprite.updateForwardAction);
    }
    public backwardMovement(tankElement: TankElement) {
        this.hullUpdate(tankElement, tankElement.model.backwardMovement, tankElement.model.rollback,
            tankElement.sprite.updateBackwardAction);
    }
    private hullUpdate(tankElement: TankElement, action: Action, reverseAction: Action, updateSprites: UpdateSprites) {
        const hullEntity = tankElement.model.tankParts.hullEntity;
        this._entityStorage.remove(hullEntity)
        action.call(tankElement.model, this._resistanceForce);
        if (!this._collisionManager.isSuccess(hullEntity)) {
            reverseAction.call(tankElement.model, this._resistanceForce);
            this.removeSpriteAccelerationEffect(tankElement);
            tankElement.model.stop();
        }
        else
            updateSprites.call(tankElement.sprite, hullEntity.points[0], hullEntity.angle,
                tankElement.model.tankParts.turret.angle);

        this._entityStorage.insert(hullEntity);
    }
    private static turretUpdate(tankElement: TankElement) {
        const tankParts = tankElement.model.tankParts;
        const hullSin = TrigCache.getSin(tankParts.hullEntity.angle);
        const hullCos = TrigCache.getCos(tankParts.hullEntity.angle);

        tankElement.sprite.rotateTurretUpdate(
            tankElement.sprite.tankSpriteParts.hullSprite.calcPosition(tankParts.hullEntity.points[0], hullSin, hullCos),
            tankParts.turret.angle, hullSin, hullCos
        );
    }
}