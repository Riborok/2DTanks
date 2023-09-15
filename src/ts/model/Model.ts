import {IEntity} from "../entitiy/IEntity";
import {BulletModel} from "./bullet/BulletModel";
import {IHealth} from "../additionally/type";
import {AirForcesCalculator, LandForcesCalculator} from "./ForcesCalculator";

export abstract class Model implements IHealth{
    protected readonly _entity: IEntity;
    protected _health: number;
    protected constructor(entity: IEntity, health: number) {
        this._entity = entity;
        this._health = health;
    }
    public get health(): number { return this._health }
    public isDead(): boolean { return this._health <= 0 }
    public get entity(): IEntity { return this._entity }
    public isIdle(): boolean { return  this._entity.velocity.length === 0 }
    public isAngularMotionStopped(): boolean { return this._entity.angularVelocity === 0 }
    protected applyVelocityChange(acceleration: number, angle: number) {
        const entity = this._entity;
        const initialSignX = Math.sign(entity.velocity.x);
        const initialSignY = Math.sign(entity.velocity.y);

        entity.velocity.addToCoordinates(acceleration * Math.cos(angle), acceleration * Math.sin(angle));

        if (initialSignX !== Math.sign(entity.velocity.x))
            entity.velocity.x = 0;
        if (initialSignY !== Math.sign(entity.velocity.y))
            entity.velocity.y = 0;
    }
    protected applyAngularVelocityChange(acceleration: number) {
        const entity = this._entity;

        const angularVelocity = entity.angularVelocity;
        if (angularVelocity > 0)
            entity.angularVelocity += angularVelocity + acceleration < 0 ? -angularVelocity : acceleration;
        else
            entity.angularVelocity -= angularVelocity + acceleration > 0 ? -angularVelocity : acceleration;
    }
    public takeDamage(bullet: BulletModel) { this._health -= bullet.damage }
}

export abstract class LandModel extends Model{
    public residualMovement(resistanceCoeff: number, airResistanceCoeff: number, deltaTime: number) {
        const entity = this._entity;
        const acceleration = LandForcesCalculator.calcAcceleration(
            0, resistanceCoeff, airResistanceCoeff, deltaTime,
            entity.velocity.length, entity.mass, entity.lengthwiseArea);
        this.applyVelocityChange(acceleration, entity.velocity.angle);
    }
    public residualAngularMovement(resistanceCoeff: number, airResistanceCoeff: number, deltaTime: number) {
        const entity = this._entity;
        const acceleration = LandForcesCalculator.calcAngularAcceleration(
            0, resistanceCoeff, airResistanceCoeff, deltaTime,
            entity.angularVelocity, entity.mass, entity.lengthwiseArea, entity.radiusLength);
        this.applyAngularVelocityChange(acceleration);
    }
}

export abstract class AirModel extends Model{
    public residualMovement(airResistanceCoeff: number, deltaTime: number) {
        const entity = this._entity;
        const acceleration = AirForcesCalculator.calcAcceleration(
            0, airResistanceCoeff, deltaTime,
            entity.velocity.length, entity.mass, entity.lengthwiseArea);
        this.applyVelocityChange(acceleration, entity.velocity.angle);
    }
    public residualAngularMovement(airResistanceCoeff: number, deltaTime: number) {
        const entity = this._entity;
        const acceleration = AirForcesCalculator.calcAngularAcceleration(
            0, airResistanceCoeff, deltaTime,
            entity.angularVelocity, entity.mass, entity.lengthwiseArea, entity.radiusLength);
        this.applyAngularVelocityChange(acceleration);
    }
}