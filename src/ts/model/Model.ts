import {IEntity} from "../entitiy/IEntity";
import {EntityManipulator} from "../entitiy/EntityManipulator";
import {GRAVITY_ACCELERATION} from "../constants/gameConstants";
import {BulletModel} from "./bullet/BulletModel";
import {IHealth} from "../additionally/type";

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
    // Physics left the chat :)
    // But for the game it is OK :)
    public residualMovement(resistanceCoeff: number, airResistanceCoeff: number, deltaTime: number) {
        const entity = this._entity;
        const acceleration = this.calcAcceleration(0, resistanceCoeff, airResistanceCoeff, deltaTime,
            entity.velocity.length);
        this.applyVelocityChange(acceleration, entity.velocity.angle);
        EntityManipulator.movement(entity);
    }
    public residualAngularMovement(resistanceCoeff: number, airResistanceCoeff: number, deltaTime: number) {
        const entity = this._entity;
        const acceleration = this.calcAngularAcceleration(0, resistanceCoeff, airResistanceCoeff, deltaTime);
        const angularVelocity = entity.angularVelocity;
        if (angularVelocity > 0)
            entity.angularVelocity += angularVelocity + acceleration < 0 ? -angularVelocity : acceleration;
        else
            entity.angularVelocity -= angularVelocity + acceleration > 0 ? -angularVelocity : acceleration;

        EntityManipulator.angularMovement(entity);
    }
    private static readonly FRAME_RATE: number = 17;
    protected calcAcceleration(thrust: number, resistanceCoeff: number, airResistanceCoeff: number, deltaTime: number,
                               speed: number): number {
        const entity = this._entity;
        const frictionForce = resistanceCoeff * entity.mass * GRAVITY_ACCELERATION;
        const airResistanceForce = airResistanceCoeff * speed * speed * entity.radiusLength * entity.radiusLength;

        return ((thrust - frictionForce - airResistanceForce) / entity.mass) * (deltaTime / Model.FRAME_RATE);
    }
    protected calcAngularAcceleration(thrust: number, resistanceCoeff: number, airResistanceCoeff: number,
                                      deltaTime: number): number {
        const entity = this._entity;
        return this.calcAcceleration(thrust, resistanceCoeff, airResistanceCoeff, deltaTime,
            entity.angularVelocity) / entity.radiusLength;
    }
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
    public takeDamage(bullet: BulletModel) { this._health -= bullet.damage }
}