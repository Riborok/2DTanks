import {TankElement} from "./TankElement";
import {IRectangularEntityStorage} from "../model/IRectangularEntityStorage";
import {ICollisionManager} from "./ICollisionManager";

type Action = () => void;

export interface IMovementManager {
    hullCounterclockwiseMovement(tankElement: TankElement): void;
    hullClockwiseMovement(tankElement: TankElement): void;
    moveForward(tankElement: TankElement): void;
    moveBackward(tankElement: TankElement): void;
}
export class MovementManager implements IMovementManager{
    private readonly _rectangularEntityStorage: IRectangularEntityStorage;
    private readonly _collisionManager: ICollisionManager;
    constructor(rectangularEntityStorage: IRectangularEntityStorage, collisionManager: ICollisionManager) {
        this._rectangularEntityStorage = rectangularEntityStorage;
        this._collisionManager = collisionManager;
    }
    public hullCounterclockwiseMovement(tankElement: TankElement) {
        this.updateHull(tankElement, tankElement.model.counterclockwiseMovement, tankElement.model.clockwiseMovement);
    }
    public hullClockwiseMovement(tankElement: TankElement) {
        this.updateHull(tankElement, tankElement.model.clockwiseMovement, tankElement.model.counterclockwiseMovement);
    }
    public moveForward(tankElement: TankElement) {
        this.updateHull(tankElement, tankElement.model.moveForward, tankElement.model.moveBackward);
    }
    public moveBackward(tankElement: TankElement) {
        this.updateHull(tankElement, tankElement.model.moveBackward, tankElement.model.moveForward);
    }
    private updateHull(tankElement: TankElement, action: Action, reverseAction: Action) {
        const hullEntity = tankElement.model.tankParts.hullEntity;
        this._rectangularEntityStorage.remove(hullEntity)
        action.call(tankElement.model);
        if (!this._collisionManager.isSuccess(hullEntity))
            reverseAction.call(tankElement.model);

        this._rectangularEntityStorage.insert(hullEntity);

        tankElement.sprite.updateSprite(hullEntity.points[0], hullEntity.angle, tankElement.model.tankParts.turret.angle);
    }
}