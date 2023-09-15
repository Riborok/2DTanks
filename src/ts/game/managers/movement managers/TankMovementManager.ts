import {TankElement} from "../../elements/TankElement";
import {Point} from "../../../geometry/Point";
import {Action, ITankMovementManager, Movement, MovementManager} from "./MovementManager";
import {EntityManipulator} from "../../../entitiy/EntityManipulator";

type UpdateSprites = (point: Point, hullAngle: number, turretAngle: number) => void;
export class TankMovementManager extends MovementManager implements ITankMovementManager{
    public residualMovement(tankElement: TankElement, deltaTime: number) {
        const sprite = tankElement.sprite;
        if (tankElement.model.isIdle()) {
            sprite.tankTrackEffect.stopped();
        }
        else {
            sprite.tankTrackEffect.setResidualMovement();
            this.hullUpdate(tankElement,
                tankElement.model.residualMovement,
                EntityManipulator.movement,
                tankElement.sprite.preUpdateAction,
                deltaTime
            );
        }
    }
    public residualAngularMovement(tankElement: TankElement, deltaTime: number) {
        if (!tankElement.model.isAngularMotionStopped()) {
            this.hullUpdate(tankElement,
                tankElement.model.residualAngularMovement,
                EntityManipulator.angularMovement,
                tankElement.sprite.preUpdateAction,
                deltaTime
            );
        }
    }
    public turretCounterclockwiseMovement(tankElement: TankElement, deltaTime: number) {
        tankElement.model.turretCounterclockwiseMovement(deltaTime);
        TankMovementManager.turretUpdate(tankElement);
    }
    public turretClockwiseMovement(tankElement: TankElement, deltaTime: number) {
        tankElement.model.turretClockwiseMovement(deltaTime);
        TankMovementManager.turretUpdate(tankElement);
    }
    public hullCounterclockwiseMovement(tankElement: TankElement, deltaTime: number) {
        this.hullUpdate(tankElement, tankElement.model.hullCounterclockwiseMovement, EntityManipulator.angularMovement,
            tankElement.sprite.preUpdateAction, deltaTime);
    }
    public hullClockwiseMovement(tankElement: TankElement, deltaTime: number) {
        this.hullUpdate(tankElement, tankElement.model.hullClockwiseMovement, EntityManipulator.angularMovement,
            tankElement.sprite.preUpdateAction, deltaTime);
    }
    public forwardMovement(tankElement: TankElement, deltaTime: number) {
        this.hullUpdate(tankElement, tankElement.model.forwardMovement, EntityManipulator.movement,
            tankElement.sprite.updateForwardAction, deltaTime);
    }
    public backwardMovement(tankElement: TankElement, deltaTime: number) {
        this.hullUpdate(tankElement, tankElement.model.backwardMovement, EntityManipulator.movement,
            tankElement.sprite.updateBackwardAction, deltaTime);
    }
    private hullUpdate(tankElement: TankElement, action: Action, movement: Movement,
                       updateSprites: UpdateSprites, deltaTime: number) {
        const entity = tankElement.model.entity;
        this._entityStorage.remove(entity);
        action.call(tankElement.model, this._resistanceCoeff, this._airResistanceCoeff, deltaTime);
        movement(entity);
        if (this._collisionManager.hasCollision(entity))
            tankElement.sprite.removeAcceleration();

        updateSprites.call(tankElement.sprite, entity.points[0], entity.angle, tankElement.model.turretAngle);

        this._entityStorage.insert(entity);
    }
    private static turretUpdate(tankElement: TankElement) {
        const model = tankElement.model;
        const angle = model.entity.angle;
        const hullSin = Math.sin(angle);
        const hullCos = Math.cos(angle);

        tankElement.sprite.rotateTurretUpdate(
            tankElement.sprite.tankSpriteParts.hullSprite.calcPosition(model.entity.points[0], hullSin, hullCos),
            model.turretAngle, hullSin, hullCos
        );
    }
}