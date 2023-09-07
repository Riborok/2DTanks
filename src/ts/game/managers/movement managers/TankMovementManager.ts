import {TankElement} from "../../elements/TankElement";
import {Point} from "../../../geometry/Point";
import {Action, ITankMovementManager, MovementManager} from "./MovementManager";

type UpdateSprites = (point: Point, hullAngle: number, turretAngle: number) => void;
export class TankMovementManager extends MovementManager implements ITankMovementManager{
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
                tankElement.sprite.preUpdateAction
            );
        }
    }
    public residualAngularMovement(tankElement: TankElement) {
        if (!tankElement.model.isAngularMotionStopped()) {
            this.hullUpdate(tankElement,
                tankElement.model.residualAngularMovement,
                tankElement.sprite.preUpdateAction
            );
        }
    }
    public turretCounterclockwiseMovement(tankElement: TankElement) {
        tankElement.model.turretCounterclockwiseMovement();
        TankMovementManager.turretUpdate(tankElement);
    }
    public turretClockwiseMovement(tankElement: TankElement) {
        tankElement.model.turretClockwiseMovement();
        TankMovementManager.turretUpdate(tankElement);
    }
    public hullCounterclockwiseMovement(tankElement: TankElement) {
        this.hullUpdate(tankElement, tankElement.model.hullCounterclockwiseMovement, tankElement.sprite.preUpdateAction);
    }
    public hullClockwiseMovement(tankElement: TankElement) {
        this.hullUpdate(tankElement, tankElement.model.hullClockwiseMovement, tankElement.sprite.preUpdateAction);
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