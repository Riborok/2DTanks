import {TankElement} from "./TankElement";
import {IRectangularEntityStorage} from "../model/IRectangularEntityStorage";
import {ICollisionManager} from "./ICollisionManager";

export class MovementManager {
    private readonly _rectangularEntityStorage: IRectangularEntityStorage;
    private readonly _collisionManager: ICollisionManager;
    constructor(rectangularEntityStorage: IRectangularEntityStorage, collisionManager: ICollisionManager) {
        this._rectangularEntityStorage = rectangularEntityStorage;
        this._collisionManager = collisionManager;
    }
    public moveForward(tankElement: TankElement) {
        this.move(tankElement, tankElement.model.moveForward);
    }
    public moveBackward(tankElement: TankElement) {
        this.move(tankElement, tankElement.model.moveBackward);
    }



    private move(tankElement: TankElement, action: () => void) {
        const hullEntity = tankElement.model.tankParts.hullEntity;
        this._rectangularEntityStorage.remove(hullEntity)
        action();
        this._collisionManager.FixIntersection(hullEntity);
        this._rectangularEntityStorage.insert(hullEntity);

        tankElement.sprite.movementUpdate(hullEntity.points[0], hullEntity.angle,
            tankElement.model.tankParts.turret.angle);
    }
}