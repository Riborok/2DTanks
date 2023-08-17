import {TankElement} from "./TankElement";
import {IRectangularEntityStorage} from "../model/IRectangularEntityStorage";
import {ICollisionManager} from "./ICollisionManager";
import {Point} from "../model/Point";
import {RectangularEntity} from "../model/IEntity";

type Action = () => void;
type UpdateSprites = (point: Point, hullAngle: number, turretAngle: number) => void;

export interface IMovementManager {
    hullCounterclockwiseMovement(tankElement: TankElement): void;
    hullClockwiseMovement(tankElement: TankElement): void;
    moveForward(tankElement: TankElement): void;
    moveBackward(tankElement: TankElement): void;
    display(tankElement: TankElement): void;
}
export class MovementManager implements IMovementManager{
    private readonly _rectangularEntityStorage: IRectangularEntityStorage;
    private readonly _collisionManager: ICollisionManager;
    constructor(rectangularEntityStorage: IRectangularEntityStorage, collisionManager: ICollisionManager) {
        this._rectangularEntityStorage = rectangularEntityStorage;
        this._collisionManager = collisionManager;
    }
    public display(tankElement: TankElement) {
        const point = tankElement.model.tankParts.hullEntity.points[0].clone();
        RectangularEntity.rotatePoint(point, tankElement.model.tankParts.hullEntity.calcCenter(),
            -tankElement.model.tankParts.hullEntity.angle);

        tankElement.sprite.display(point,
            tankElement.model.tankParts.hullEntity.angle,
            tankElement.model.tankParts.turret.angle);
    }
    public hullCounterclockwiseMovement(tankElement: TankElement) {
        this.updateHull(tankElement, tankElement.model.counterclockwiseMovement, tankElement.model.clockwiseMovement,
            tankElement.sprite.rotateHullUpdate);
    }
    public hullClockwiseMovement(tankElement: TankElement) {
        this.updateHull(tankElement, tankElement.model.clockwiseMovement, tankElement.model.counterclockwiseMovement,
            tankElement.sprite.rotateHullUpdate);
    }
    public moveForward(tankElement: TankElement) {
        this.updateHull(tankElement, tankElement.model.moveForward, tankElement.model.moveBackward,
            tankElement.sprite.movementUpdate);
    }
    public moveBackward(tankElement: TankElement) {
        this.updateHull(tankElement, tankElement.model.moveBackward, tankElement.model.moveForward,
            tankElement.sprite.movementUpdate);
    }
    private updateHull(tankElement: TankElement, action: Action, reverseAction: Action, spriteUpdate: UpdateSprites) {
        const hullEntity = tankElement.model.tankParts.hullEntity;
        this._rectangularEntityStorage.remove(hullEntity)
        action.call(tankElement.model);
        if (!this._collisionManager.isSuccess(hullEntity))
            reverseAction.call(tankElement.model);

        this._rectangularEntityStorage.insert(hullEntity);

        const point = tankElement.model.tankParts.hullEntity.points[0].clone();
        RectangularEntity.rotatePoint(point, tankElement.model.tankParts.hullEntity.calcCenter(),
            -tankElement.model.tankParts.hullEntity.angle);
        spriteUpdate.call(tankElement.sprite, point, hullEntity.angle, tankElement.model.tankParts.turret.angle);
    }
}