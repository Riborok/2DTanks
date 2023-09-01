import {TankParts} from "./TankParts";
import {TrigCache} from "../../additionally/LRUCache";
import {EntityManipulator} from "../entitiy/EntityManipulator";
import {BulletModel} from "../bullet/BulletModel";
import {BulletModelCreator} from "../bullet/BulletModelCreator";
import {IEntity} from "../entitiy/IEntity";
import {Model} from "../Model";
import {Point} from "../../geometry/Point";

export class TankModel extends Model {
    private readonly _tankParts: TankParts;

    private _bulletQuantity: number = 0;
    private _lastTimeShot: number;
    private _bulletNum: number;
    private _isBraking: boolean;
    public constructor(tankParts: TankParts, entity: IEntity) {
        super(entity);
        this._tankParts = tankParts;
        this._lastTimeShot = Date.now();
        this._isBraking = false;

        this._bulletNum = 0;
    }
    public isIdle(): boolean { return  this._entity.speed === 0 }
    public isAngularMotionStopped(): boolean { return this._entity.angularVelocity === 0 }
    public get tankParts(): TankParts { return this._tankParts }
    public shot(): BulletModel | null {
        const dateNow = Date.now();
        if (this._bulletQuantity === 0 || dateNow - this._lastTimeShot < this._tankParts.weapon.reloadSpeed)
            return null;

        const center = this._entity.calcCenter();
        const xStart = center.x +
            this._tankParts.weapon.barrelLength * TrigCache.getCos(this._tankParts.turret.angle);
        const yStart = center.y +
            this._tankParts.weapon.barrelLength * TrigCache.getSin(this._tankParts.turret.angle);

        const bulletModel = BulletModelCreator.create(this._bulletNum, new Point(xStart, yStart),
            this._tankParts.turret.angle);
        bulletModel.bullet.launchFromWeapon(this._tankParts.weapon);
        this._lastTimeShot = dateNow;
        this._bulletQuantity--;

        return bulletModel;
    }
    public incBulletQuantity(quantity: number) {
        this._bulletQuantity = Math.min(this._bulletQuantity + quantity, this._tankParts.turret.bulletCapacity);
    }
    public takeNewBullet(bulletNum: number) {
        this._bulletNum = bulletNum;
    }
    public turretClockwiseMovement() {
        this._tankParts.turret.clockwiseMovement();
    }
    public turretCounterclockwiseMovement() {
        this._tankParts.turret.counterclockwiseMovement();
    }
    public hullClockwiseMovement(resistanceCoeff: number, airResistanceCoeff: number) {
        const entity = this._entity;
        const angularData = this._tankParts.track.angularData;
        if (entity.angularVelocity < angularData.finishSpeed)
            entity.angularVelocity += this.calcAcceleration(angularData.force, resistanceCoeff,
                airResistanceCoeff, entity.angularVelocity) / entity.radiusLength;

        this.updateAngularVelocity();

        EntityManipulator.angularMovement(entity);
        this._tankParts.turret.incAngle(entity.angularVelocity);
    }
    public hullCounterclockwiseMovement(resistanceCoeff: number, airResistanceCoeff: number) {
        const entity = this._entity;
        const angularData = this._tankParts.track.angularData;
        if (-entity.angularVelocity < angularData.finishSpeed)
            entity.angularVelocity -= this.calcAcceleration(angularData.force, resistanceCoeff,
                airResistanceCoeff, entity.angularVelocity) / entity.radiusLength;

        this.updateAngularVelocity();

        EntityManipulator.angularMovement(entity);
        this._tankParts.turret.incAngle(entity.angularVelocity);
    }
    private updateAngularVelocity() {
        if (!this.isIdle()) {
            const entity = this._entity;
            const track = this._tankParts.track;

            const speedModule = Math.abs(entity.speed);
            const speedFactor = speedModule / (track.forwardData.finishSpeed * 20);
            const massFactor =  entity.mass / 200;

            if (this._isBraking)
                entity.angularVelocity *= (1 + massFactor / 10) * (1 + speedFactor / 10);
            else {
                entity.angularVelocity *= (1 - massFactor) * (1 - speedFactor);
                entity.speed *= (1 - massFactor);
            }
        }
    }
    public forwardMovement(resistanceCoeff: number, airResistanceCoeff: number) {
        const entity = this._entity;
        const forwardData = this._tankParts.track.forwardData;
        if (entity.speed < 0) {
            this._isBraking = true;
            entity.speed -= this.calcAcceleration(-forwardData.force, resistanceCoeff, airResistanceCoeff, entity.speed);
        }
        else if (entity.speed < forwardData.finishSpeed) {
            this._isBraking = false;
            entity.speed += this.calcAcceleration(forwardData.force, resistanceCoeff, airResistanceCoeff, entity.speed);
        }
        EntityManipulator.movement(entity);
    }
    public backwardMovement(resistanceCoeff: number, airResistanceCoeff: number) {
        const entity = this._entity;
        const backwardData = this._tankParts.track.backwardData;
        if (entity.speed > 0) {
            this._isBraking = true;
            entity.speed += this.calcAcceleration(-backwardData.force, resistanceCoeff, airResistanceCoeff, entity.speed);
        }
        else if (-entity.speed < backwardData.finishSpeed) {
            this._isBraking = false;
            entity.speed -= this.calcAcceleration(backwardData.force, resistanceCoeff, airResistanceCoeff, entity.speed);
        }
        EntityManipulator.movement(entity);
    }
    public residualMovement(resistanceCoeff: number, airResistanceCoeff: number) {
        this._isBraking = false;
        super.residualMovement(resistanceCoeff, airResistanceCoeff);
    }
    public residualAngularMovement(resistanceCoeff: number, airResistanceCoeff: number) {
        super.residualAngularMovement(resistanceCoeff, airResistanceCoeff);
        this._tankParts.turret.incAngle(this._entity.angularVelocity);
    }
}