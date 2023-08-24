import {TankElement} from "./TankElement";
import {IEntityStorage} from "../model/IEntityStorage";
import {ICollisionManager} from "./ICollisionManager";
import {TrigCache} from "../additionally/LRUCache";

type Action = () => void;

export interface IMovementManager {
    hullCounterclockwiseMovement(tankElement: TankElement): void;
    hullClockwiseMovement(tankElement: TankElement): void;
    moveForward(tankElement: TankElement): void;
    moveBackward(tankElement: TankElement): void;
    turretCounterclockwiseMovement(tankElement: TankElement): void;
    turretClockwiseMovement(tankElement: TankElement): void;
    stopTank(tankElement: TankElement): void;
}
export class MovementManager implements IMovementManager{
    private readonly _entityStorage: IEntityStorage;
    private readonly _collisionManager: ICollisionManager;
    public constructor(entityStorage: IEntityStorage, collisionManager: ICollisionManager) {
        this._entityStorage = entityStorage;
        this._collisionManager = collisionManager;
    }
    public stopTank(tankElement: TankElement) {
        tankElement.model.braking();
        tankElement.sprite.tankSpriteParts.bottomTrackSprite.brake();
        tankElement.sprite.tankSpriteParts.topTrackSprite.brake();
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
        this.hullUpdate(tankElement, tankElement.model.hullCounterclockwiseMovement, tankElement.model.hullClockwiseMovement);
    }
    public hullClockwiseMovement(tankElement: TankElement) {
        this.hullUpdate(tankElement, tankElement.model.hullClockwiseMovement, tankElement.model.hullCounterclockwiseMovement);
    }
    public moveForward(tankElement: TankElement) {
        this.hullUpdate(tankElement, tankElement.model.forwardMovement, tankElement.model.rollback);
    }
    public moveBackward(tankElement: TankElement) {
        this.hullUpdate(tankElement, tankElement.model.backwardMovement, tankElement.model.rollback);
    }
    private hullUpdate(tankElement: TankElement, action: Action, reverseAction: Action) {
        const hullEntity = tankElement.model.tankParts.hullEntity;
        this._entityStorage.remove(hullEntity)
        action.call(tankElement.model);
        if (!this._collisionManager.isSuccess(hullEntity)) {
            reverseAction.call(tankElement.model);
            this.stopTank(tankElement);
        }

        this._entityStorage.insert(hullEntity);

        tankElement.sprite.updateSprite(hullEntity.points[0], hullEntity.angle, tankElement.model.tankParts.turret.angle);
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