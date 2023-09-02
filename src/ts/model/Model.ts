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
        const acceleration = this.calcAcceleration(0, resistanceCoeff, airResistanceCoeff, entity.velocity.length);

        const initialSignX = Math.sign(entity.velocity.x);
        const initialSignY = Math.sign(entity.velocity.y);

        const angle = entity.velocity.angle;
        entity.velocity.x += acceleration * Math.cos(angle);
        entity.velocity.y += acceleration * Math.sin(angle);

        if (initialSignX !== Math.sign(entity.velocity.x))
            entity.velocity.x = 0;

        if (initialSignY !== Math.sign(entity.velocity.y))
            entity.velocity.y = 0;

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
        const airResistanceForce = airResistanceCoeff * speed * speed;

        return (thrust - frictionForce - airResistanceForce) / this._entity.mass;
    }
}