import {TankElement} from "./TankElement";
import {IEntityStorage} from "../model/IEntityStorage";
import {ICollisionManager} from "./ICollisionManager";
import {TrigCache} from "../additionally/LRUCache";
import {Point} from "../model/Point";

type Action = () => void;
type UpdateSprites = (point: Point, hullAngle: number, turretAngle: number) => void;

export interface IMovementManager {
    hullCounterclockwiseMovement(tankElement: TankElement): void;
    hullClockwiseMovement(tankElement: TankElement): void;
    forwardMovement(tankElement: TankElement): void;
    backwardMovement(tankElement: TankElement): void;
    turretCounterclockwiseMovement(tankElement: TankElement): void;
    turretClockwiseMovement(tankElement: TankElement): void;
    removeAcceleration(tankElement: TankElement): void;
}
export class MovementManager implements IMovementManager{
    private readonly _entityStorage: IEntityStorage;
    private readonly _collisionManager: ICollisionManager;
    public constructor(entityStorage: IEntityStorage, collisionManager: ICollisionManager) {
        this._entityStorage = entityStorage;
        this._collisionManager = collisionManager;
    }
    public removeAcceleration(tankElement: TankElement) {
        tankElement.model.removeAcceleration();
        const tankSpriteParts = tankElement.sprite.tankSpriteParts;
        tankSpriteParts.bottomTrackSprite.removeAcceleration();
        tankSpriteParts.topTrackSprite.removeAcceleration();
        tankSpriteParts.bottomSpriteAccelerationEffect.removeAcceleration();
        tankSpriteParts.topSpriteAccelerationEffect.removeAcceleration();
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
            tankElement.sprite.updateSprite);
    }
    private hullUpdate(tankElement: TankElement, action: Action, reverseAction: Action, updateSprites: UpdateSprites) {
        const hullEntity = tankElement.model.tankParts.hullEntity;
        this._entityStorage.remove(hullEntity)
        action.call(tankElement.model);
        if (!this._collisionManager.isSuccess(hullEntity)) {
            reverseAction.call(tankElement.model);
            this.removeAcceleration(tankElement);
        }

        this._entityStorage.insert(hullEntity);

        updateSprites.call(tankElement.sprite, hullEntity.points[0], hullEntity.angle,
            tankElement.model.tankParts.turret.angle);
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