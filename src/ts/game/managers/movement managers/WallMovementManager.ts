import {Action, IWallMovementManager, Movement, MovementManager} from "./MovementManager";
import {WallElement} from "../../elements/WallElement";
import {EntityManipulator} from "../../../polygon/entity/EntityManipulator";
import {IModelCollisionManager} from "../IModelCollisionManager";
import {IStorage} from "../../../additionally/type";
import {IEntity} from "../../../polygon/entity/IEntity";

export class WallMovementManager extends MovementManager implements IWallMovementManager {
    protected override readonly _collisionResolver: IModelCollisionManager;
    public constructor(entityStorage: IStorage<IEntity>, modelCollisionManager: IModelCollisionManager) {
        super(entityStorage, modelCollisionManager);
    }
    public override get collisionResolver(): IModelCollisionManager { return this._collisionResolver }
    private residualAngularMovement(wallElement: WallElement, deltaTime: number) {
        if (!wallElement.model.isAngularMotionStopped())
            this.update(wallElement, wallElement.model.residualAngularMovement, EntityManipulator.angularMovement, deltaTime);
    }
    private residualMovement(wallElement: WallElement, deltaTime: number) {
        if (!wallElement.model.isIdle())
            this.update(wallElement, wallElement.model.residualMovement, EntityManipulator.movement, deltaTime);
    }
    private update(wallElement: WallElement, action: Action, movement: Movement, deltaTime: number) {
        const entity = wallElement.model.entity;
        this._entityStorage.remove(entity);
        action.call(wallElement.model, this._resistanceCoeff, this._airResistanceCoeff, deltaTime);
        movement(entity);
        this._collisionResolver.resolveCollision(entity);

        wallElement.sprite.updateAfterAction(entity.points[0], entity.angle);

        this._entityStorage.insert(entity);
    }
    public isCompleteMotion(wallElement: WallElement): boolean {
        return wallElement.model.isAngularMotionStopped() && wallElement.model.isIdle();
    }
    public movement(wallElement: WallElement, deltaTime: number) {
        this.residualAngularMovement(wallElement, deltaTime);
        this.residualMovement(wallElement, deltaTime);
    }
}