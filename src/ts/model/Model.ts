import {IEntity} from "./entitiy/IEntity";
import {EntityManipulator} from "./entitiy/EntityManipulator";

export abstract class Model {
    protected readonly _entity: IEntity;
    protected constructor(entity: IEntity) {
        this._entity = entity;
    }
    public get entity(): IEntity { return this._entity }
    public residualMovement(resistanceForce: number) {
        const speed = this._entity.speed;
        if (speed > 0)
            this._entity.speed -= speed - resistanceForce < 0 ? speed : resistanceForce;
        else
            this._entity.speed += speed - resistanceForce > 0 ? speed : resistanceForce;

        EntityManipulator.movement(this._entity);
    }
}