import {BulletEntity, IBulletManufacturing, LightBulletManufacturing} from "./BulletEntity";
import {TankModelParts} from "./TankModelParts";
import {TrigCache} from "../../additionally/LRUCache";

export class TankModel {
    private readonly _tankParts: TankModelParts;

    private _bulletQuantity: number = 0;
    private _lastTimeShot: number;
    private _bulletManufacturing: IBulletManufacturing;
    private _isBraking: boolean;
    public constructor(tankParts: TankModelParts) {
        this._tankParts = tankParts;
        this._lastTimeShot = Date.now();
        this._isBraking = false;

        this._bulletManufacturing = new LightBulletManufacturing();
    }
    public isIdle(): boolean { return  this._tankParts.hullEntity.speed === 0 }
    public stop() { this._tankParts.hullEntity.increaseSpeedBy(-this._tankParts.hullEntity.speed) }
    public get tankParts(): TankModelParts { return this._tankParts }
    public shot(): BulletEntity | null {
        const dateNow = Date.now();
        if (this._bulletQuantity === 0 || dateNow - this._lastTimeShot < this._tankParts.weapon.reloadSpeed)
            return null;

        const hullEntity = this._tankParts.hullEntity;
        const xStart = ((hullEntity.points[0].x + hullEntity.points[2].x) / 2) +
            this._tankParts.weapon.barrelLength * TrigCache.getCos(this._tankParts.turret.angle);
        const yStart = ((hullEntity.points[0].y + hullEntity.points[2].y) / 2) +
            this._tankParts.weapon.barrelLength * TrigCache.getSin(this._tankParts.turret.angle);

        const bulletEntity = this._bulletManufacturing.create(xStart, yStart, this._tankParts.turret.angle);
        bulletEntity.launchFromWeapon(this._tankParts.weapon);
        this._lastTimeShot = dateNow;
        this._bulletQuantity--;

        return bulletEntity;
    }
    public incBulletQuantity(quantity: number) {
        this._bulletQuantity = Math.min(this._bulletQuantity + quantity, this._tankParts.turret.bulletCapacity);
    }
    public takeNewBulletManufacturing(bulletManufacturing: IBulletManufacturing) {
        this._bulletManufacturing = bulletManufacturing;
    }
    public turretClockwiseMovement() {
        this._tankParts.turret.clockwiseMovement();
    }
    public turretCounterclockwiseMovement() {
        this._tankParts.turret.counterclockwiseMovement();
    }
    public hullClockwiseMovement(resistanceForce: number) {
        const angleSpeed = this.calculateAngleSpeed(resistanceForce);
        this._tankParts.hullEntity.rotatePoints(angleSpeed);
        this._tankParts.turret.incAngle(angleSpeed);
    }
    public hullCounterclockwiseMovement(resistanceForce: number) {
        const angleSpeed = - this.calculateAngleSpeed(resistanceForce);
        this._tankParts.hullEntity.rotatePoints(angleSpeed);
        this._tankParts.turret.incAngle(angleSpeed);
    }
    private calculateAngleSpeed(resistanceForce: number): number {
        let angleSpeed = this._tankParts.track.angleSpeed - resistanceForce;

        if (!this.isIdle()) {
            const hullEntity = this._tankParts.hullEntity;
            const speedModule = Math.abs(hullEntity.speed);
            const speedFactor = 1 - speedModule /
                (this._tankParts.track.movementParameters.finishForwardSpeed * 8);
            const massFactor = 1 - this._tankParts.mass / 10;
            angleSpeed *= massFactor * speedFactor;
            if (this._isBraking)
                angleSpeed *= (1 + speedModule / 7)
            else
                hullEntity.scaleSpeedBy(1 - massFactor * angleSpeed);
        }
        return angleSpeed;
    }
    public forwardMovement(resistanceForce: number) {
        const track = this._tankParts.track;
        const hullEntity = this._tankParts.hullEntity;
        if (hullEntity.speed < 0) {
            this._isBraking = true;
            hullEntity.increaseSpeedBy(track.movementParameters.forwardAcceleration + resistanceForce);
        }
        else if (hullEntity.speed < track.movementParameters.finishForwardSpeed) {
            this._isBraking = false;
            hullEntity.increaseSpeedBy(track.movementParameters.forwardAcceleration - resistanceForce);
        }
        hullEntity.movement();
    }
    public backwardMovement(resistanceForce: number) {
        const track = this._tankParts.track;
        const hullEntity = this._tankParts.hullEntity;
        if (hullEntity.speed > 0) {
            this._isBraking = true;
            hullEntity.increaseSpeedBy(- (track.movementParameters.backwardAcceleration + resistanceForce));
        }
        else if (-hullEntity.speed < track.movementParameters.finishBackwardSpeed) {
            this._isBraking = false;
            hullEntity.increaseSpeedBy(- (track.movementParameters.backwardAcceleration - resistanceForce));
        }
        hullEntity.movement();
    }
    public residualMovement(resistanceForce: number) {
        this._isBraking = false;
        const hullEntity = this._tankParts.hullEntity;
        const speed = hullEntity.speed;
        if (speed > 0)
            hullEntity.increaseSpeedBy(speed - resistanceForce < 0 ? speed : -resistanceForce);
        else
            hullEntity.increaseSpeedBy(speed - resistanceForce > 0 ? speed : resistanceForce);

        hullEntity.movement();
    }
    public rollback() {
        this._tankParts.hullEntity.rollback();
    }
}