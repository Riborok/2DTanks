import {TankParts} from "./TankParts";
import {EntityManipulator} from "../entitiy/EntityManipulator";
import {BulletModel} from "../bullet/BulletModel";
import {BulletModelCreator} from "../bullet/BulletModelCreator";
import {IEntity} from "../entitiy/IEntity";
import {Model} from "../Model";
import {Point} from "../../geometry/Point";
import {DEGREE_TO_RADIAN} from "../../constants/gameConstants";
import {MotionData} from "../../additionally/type";

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
    public isIdle(): boolean { return  this._entity.velocity.length === 0 }
    public isAngularMotionStopped(): boolean { return this._entity.angularVelocity === 0 }
    public get tankParts(): TankParts { return this._tankParts }
    public shot(): BulletModel | null {
        const dateNow = Date.now();
        if (this._bulletQuantity === 0 || dateNow - this._lastTimeShot < this._tankParts.weapon.reloadSpeed)
            return null;

        const center = this._entity.calcCenter();
        const muzzleLength = this._tankParts.turret.width / 2 + this._tankParts.weapon.barrelLength;
        const xStart = center.x + muzzleLength * Math.cos(this._tankParts.turret.angle);
        const yStart = center.y + muzzleLength * Math.sin(this._tankParts.turret.angle);

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
            const velocity = entity.velocity;

            if (this._isBraking) {
                const speedFactor = 1 + velocity.length / (this._tankParts.track.forwardData.finishSpeed * 200);
                const massFactor = 1 + entity.mass / 2000;
                entity.angularVelocity *= massFactor * speedFactor;
            }
            else {
                const speedFactor = 1 - velocity.length / (this._tankParts.track.forwardData.finishSpeed * 20);
                const massFactor = 1 - entity.mass / 200;
                entity.angularVelocity *= massFactor * speedFactor;
                velocity.x *= massFactor;
                velocity.y *= massFactor;
            }
        }
    }
    public forwardMovement(resistanceCoeff: number, airResistanceCoeff: number) {
        this.movement(this._tankParts.track.forwardData, this._entity.angle,
            resistanceCoeff, airResistanceCoeff);
    }
    public backwardMovement(resistanceCoeff: number, airResistanceCoeff: number) {
        this.movement(this._tankParts.track.backwardData, this._entity.angle - Math.PI,
            resistanceCoeff, airResistanceCoeff);
    }
    private movement(data: MotionData, angle: number, resistanceCoeff: number, airResistanceCoeff: number) {
        const entity = this._entity;
        const speed = entity.velocity.length;

        const velocityAngle = speed === 0 ? angle : entity.velocity.angle;
        const deltaAngle = Math.abs(angle - velocityAngle);

        let acceleration: number;
        if (speed < data.finishSpeed && deltaAngle < DEGREE_TO_RADIAN) {
            this._isBraking = false;
            acceleration = this.calcAcceleration(data.force, resistanceCoeff, airResistanceCoeff, speed);
        }
        else {
            this._isBraking = true;
            acceleration = this.calcAcceleration(data.force * Math.cos(deltaAngle),
                resistanceCoeff, airResistanceCoeff, speed);
        }
        entity.velocity.x += acceleration * Math.cos(velocityAngle);
        entity.velocity.y += acceleration * Math.sin(velocityAngle);
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