import {Action, IWallMovementManager, MovementManager} from "./MovementManager";
import {WallElement} from "../../elements/WallElement";

export class WallMovementManager extends MovementManager implements IWallMovementManager {
    private hasResidualAngularMovement(wallElement: WallElement): boolean {
        if (!wallElement.model.isAngularMotionStopped()) {
            this.update(wallElement, wallElement.model.residualAngularMovement);
            return true;
        }
        return false;
    }
    private hasResidualMovement(wallElement: WallElement): boolean {
        if (!wallElement.model.isIdle()) {
            this.update(wallElement, wallElement.model.residualMovement);
            return true;
        }
        return false;
    }
    private update(wallElement: WallElement, action: Action) {
        const entity = wallElement.model.entity;
        this._entityStorage.remove(entity)
        action.call(wallElement.model, this._resistanceCoeff, this._airResistanceCoeff);
        this._collisionManager.hasCollision(entity);

        wallElement.sprite.updateAfterAction(entity.points[0], entity.angle);

        this._entityStorage.insert(entity);
    }

    public hasAnyResidualMovement(wallElement: WallElement): boolean {
        const hasAngularMovement = this.hasResidualAngularMovement(wallElement);
        const hasMovement = this.hasResidualMovement(wallElement);
        return hasAngularMovement || hasMovement;
    }
}