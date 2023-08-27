import {TankParts} from "./TankParts";
import {TrigCache} from "../../additionally/LRUCache";
import {EntityManipulator} from "../entitiy/EntityManipulator";
import {BulletModel} from "../bullet/BulletModel";
import {BulletModelCreator} from "../bullet/BulletModelCreator";
import {IEntity} from "../entitiy/IEntity";
import {Model} from "../Model";

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
    public stop() { this._entity.speed = 0 }
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

        const bulletModel = BulletModelCreator.create(this._bulletNum, xStart, yStart, this._tankParts.turret.angle);
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
    public hullClockwiseMovement(resistanceForce: number) {
        const angleSpeed = this.calculateAngleSpeed(resistanceForce);
        EntityManipulator.rotatePointAroundTarget(this._entity, angleSpeed, this._entity.calcCenter());
        this._tankParts.turret.incAngle(angleSpeed);
    }
    public hullCounterclockwiseMovement(resistanceForce: number) {
        const angleSpeed = - this.calculateAngleSpeed(resistanceForce);
        EntityManipulator.rotatePointAroundTarget(this._entity, angleSpeed, this._entity.calcCenter());
        this._tankParts.turret.incAngle(angleSpeed);
    }
    private calculateAngleSpeed(resistanceForce: number): number {
        let angleSpeed = this._tankParts.track.angleSpeed - resistanceForce;

        if (!this.isIdle()) {
            const speedModule = Math.abs(this._entity.speed);
            const speedFactor = 1 - speedModule /
                (this._tankParts.track.movementParameters.finishForwardSpeed * 8);
            const massFactor = 1 - this._entity.mass / 10;
            angleSpeed *= massFactor * speedFactor;
            if (this._isBraking)
                angleSpeed *= 1 + speedModule / 7;
            else
                this._entity.speed *= 1 - massFactor * angleSpeed;
        }
        return angleSpeed;
    }
    public forwardMovement(resistanceForce: number) {
        const track = this._tankParts.track;
        if (this._entity.speed < 0) {
            this._isBraking = true;
            this._entity.speed += track.movementParameters.forwardAcceleration + resistanceForce;
        }
        else if (this._entity.speed < track.movementParameters.finishForwardSpeed) {
            this._isBraking = false;
            this._entity.speed += track.movementParameters.forwardAcceleration - resistanceForce;
        }
        EntityManipulator.movement(this._entity);
    }
    public backwardMovement(resistanceForce: number) {
        const track = this._tankParts.track;
        if (this._entity.speed > 0) {
            this._isBraking = true;
            this._entity.speed -= track.movementParameters.backwardAcceleration + resistanceForce;
        }
        else if (-this._entity.speed < track.movementParameters.finishBackwardSpeed) {
            this._isBraking = false;
            this._entity.speed -= track.movementParameters.backwardAcceleration - resistanceForce;
        }
        EntityManipulator.movement(this._entity);
    }
    public residualMovement(resistanceForce: number) {
        this._isBraking = false;
        super.residualMovement(resistanceForce);
    }
    public rollback() {
        EntityManipulator.movement(this._entity, EntityManipulator.calcOppositeVelocity);
    }
}