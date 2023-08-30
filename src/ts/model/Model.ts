import {IEntity} from "./entitiy/IEntity";
import {EntityManipulator} from "./entitiy/EntityManipulator";
import {GRAVITY_ACCELERATION} from "../constants/gameConstants";

export abstract class Model {
    protected readonly _entity: IEntity;
    protected constructor(entity: IEntity) {
        this._entity = entity;
    }
    public get entity(): IEntity { return this._entity }
    public residualMovement(resistanceCoeff: number, airResistanceCoeff: number) {
        const entity = this._entity;
        const acceleration = this.calcAcceleration(0, resistanceCoeff, airResistanceCoeff, entity.speed);
        const speed = entity.speed;
        if (speed > 0)
            entity.speed += speed + acceleration < 0 ? -speed : acceleration;
        else
            entity.speed -= speed + acceleration > 0 ? -speed : acceleration;

        EntityManipulator.movement(entity);
    }
    public residualAngularMovement(resistanceCoeff: number, airResistanceCoeff: number) {
        const entity = this._entity;
        const acceleration = this.calcAcceleration(0, resistanceCoeff, airResistanceCoeff,
                entity.angularVelocity) / entity.radiusLength;
        const angularVelocity = entity.angularVelocity;
        if (angularVelocity > 0)
            entity.angularVelocity += angularVelocity + acceleration < 0 ? -angularVelocity : acceleration;
        else
            entity.angularVelocity -= angularVelocity + acceleration > 0 ? -angularVelocity : acceleration;

        EntityManipulator.angularMovement(entity);
    }
    protected calcAcceleration(thrust: number, resistanceCoeff: number, airResistanceCoeff: number, speed: number): number {
        const frictionForce = resistanceCoeff * this._entity.mass * GRAVITY_ACCELERATION;
        speed = Math.abs(speed);
        const airResistanceForce = airResistanceCoeff * speed * speed;

        return (thrust - frictionForce - airResistanceForce) / this._entity.mass;
    }
}