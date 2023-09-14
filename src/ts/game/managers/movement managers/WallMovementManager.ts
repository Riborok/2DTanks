import {Action, IWallMovementManager, MovementManager} from "./MovementManager";
import {WallElement} from "../../elements/WallElement";

export class WallMovementManager extends MovementManager implements IWallMovementManager {
    private residualAngularMovement(wallElement: WallElement, deltaTime: number) {
        if (!wallElement.model.isAngularMotionStopped())
            this.update(wallElement, wallElement.model.residualAngularMovement, deltaTime);
    }
    private residualMovement(wallElement: WallElement, deltaTime: number) {
        if (!wallElement.model.isIdle())
            this.update(wallElement, wallElement.model.residualMovement, deltaTime);
    }
    private update(wallElement: WallElement, action: Action, deltaTime: number) {
        const entity = wallElement.model.entity;
        this._entityStorage.remove(entity);
        action.call(wallElement.model, this._resistanceCoeff, this._airResistanceCoeff, deltaTime);
        this._collisionManager.hasCollision(entity);

        wallElement.sprite.updateAfterAction(entity.points[0], entity.angle);

        this._entityStorage.insert(entity);
    }
    public hasAnyResidualMovement(wallElement: WallElement): boolean {
        return !wallElement.model.isAngularMotionStopped() || !wallElement.model.isIdle();
    }
    public movement(wallElement: WallElement, deltaTime: number) {
        this.residualAngularMovement(wallElement, deltaTime);
        this.residualMovement(wallElement, deltaTime);
    }
}