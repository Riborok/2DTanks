import {IEntity} from "../polygon/entity/IEntity";
import {IBulletModel} from "./bullet/IBulletModel";
import {IHealth} from "../utils/types";
import {AirForcesCalculator, LandForcesCalculator} from "./ForcesCalculator";

export interface IModel extends IHealth {
    isDead(): boolean;
    get entity(): IEntity;
    isIdle(): boolean;
    isAngularMotionStopped(): boolean;
    takeDamage(bullet: IBulletModel): void;
}

export abstract class Model implements IModel {
    protected readonly _entity: IEntity;
    protected _health: number;
    public abstract get maxHealth(): number;
    
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
    
    public takeDamage(bullet: IBulletModel) { this._health -= bullet.damage }
}

export interface ILandModel extends IModel {
    residualMovement(resistanceCoeff: number, airResistanceCoeff: number, deltaTime: number): void;
    residualAngularMovement(resistanceCoeff: number, airResistanceCoeff: number, deltaTime: number): void;
}

export abstract class LandModel extends Model implements ILandModel {
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

export interface IAirModel extends IModel {
    residualMovement(airResistanceCoeff: number, deltaTime: number): void;
    residualAngularMovement(airResistanceCoeff: number, deltaTime: number): void;
}

export abstract class AirModel extends Model implements IAirModel {
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


