import {BulletEntity, IBulletManufacturing, LightBulletManufacturing} from "./entities/BulletEntity";
import {TankComponents} from "./TankComponents";
import {TrigCache} from "../additionally/LRUCache";

export class TankModel {
    private readonly _tankComponents: TankComponents;

    private _bulletQuantity: number = 0;
    private _lastTimeShot: number;
    private _bulletManufacturing: IBulletManufacturing;
    private _isBraking: boolean;
    public constructor(tankComponents: TankComponents) {
        this._tankComponents = tankComponents;
        this._lastTimeShot = Date.now();
        this._isBraking = false;

        this._bulletManufacturing = new LightBulletManufacturing();
    }
    public isIdle(): boolean { return  this._tankComponents.tankEntity.speed === 0 }
    public stop() { this._tankComponents.tankEntity.increaseSpeedBy(-this._tankComponents.tankEntity.speed) }
    public get tankComponents(): TankComponents { return this._tankComponents }
    public shot(): BulletEntity | null {
        const dateNow = Date.now();
        if (this._bulletQuantity === 0 || dateNow - this._lastTimeShot < this._tankComponents.weapon.reloadSpeed)
            return null;

        const tankEntity = this._tankComponents.tankEntity;
        const xStart = ((tankEntity.points[0].x + tankEntity.points[2].x) / 2) +
            this._tankComponents.weapon.barrelLength * TrigCache.getCos(this._tankComponents.turret.angle);
        const yStart = ((tankEntity.points[0].y + tankEntity.points[2].y) / 2) +
            this._tankComponents.weapon.barrelLength * TrigCache.getSin(this._tankComponents.turret.angle);

        const bulletEntity = this._bulletManufacturing.create(xStart, yStart, this._tankComponents.turret.angle);
        bulletEntity.launchFromWeapon(this._tankComponents.weapon);
        this._lastTimeShot = dateNow;
        this._bulletQuantity--;

        return bulletEntity;
    }
    public incBulletQuantity(quantity: number) {
        this._bulletQuantity = Math.min(this._bulletQuantity + quantity, this._tankComponents.turret.bulletCapacity);
    }
    public takeNewBulletManufacturing(bulletManufacturing: IBulletManufacturing) {
        this._bulletManufacturing = bulletManufacturing;
    }
    public turretClockwiseMovement() {
        this._tankComponents.turret.clockwiseMovement();
    }
    public turretCounterclockwiseMovement() {
        this._tankComponents.turret.counterclockwiseMovement();
    }
    public hullClockwiseMovement(resistanceForce: number) {
        const angleSpeed = this.calculateAngleSpeed(resistanceForce);
        this._tankComponents.tankEntity.rotatePoints(angleSpeed);
        this._tankComponents.turret.incAngle(angleSpeed);
    }
    public hullCounterclockwiseMovement(resistanceForce: number) {
        const angleSpeed = - this.calculateAngleSpeed(resistanceForce);
        this._tankComponents.tankEntity.rotatePoints(angleSpeed);
        this._tankComponents.turret.incAngle(angleSpeed);
    }
    private calculateAngleSpeed(resistanceForce: number): number {
        let angleSpeed = this._tankComponents.track.angleSpeed - resistanceForce;

        if (!this.isIdle()) {
            const tankEntity = this._tankComponents.tankEntity;
            const speedModule = Math.abs(tankEntity.speed);
            const speedFactor = 1 - speedModule /
                (this._tankComponents.track.movementParameters.finishForwardSpeed * 8);
            const massFactor = 1 - tankEntity.mass / 10;
            angleSpeed *= massFactor * speedFactor;
            if (this._isBraking)
                angleSpeed *= (1 + speedModule / 7)
            else
                tankEntity.scaleSpeedBy(1 - massFactor * angleSpeed);
        }
        return angleSpeed;
    }
    public forwardMovement(resistanceForce: number) {
        const track = this._tankComponents.track;
        const tankEntity = this._tankComponents.tankEntity;
        if (tankEntity.speed < 0) {
            this._isBraking = true;
            tankEntity.increaseSpeedBy(track.movementParameters.forwardAcceleration + resistanceForce);
        }
        else if (tankEntity.speed < track.movementParameters.finishForwardSpeed) {
            this._isBraking = false;
            tankEntity.increaseSpeedBy(track.movementParameters.forwardAcceleration - resistanceForce);
        }
        tankEntity.calcMovementVector();
        tankEntity.movement();
    }
    public backwardMovement(resistanceForce: number) {
        const track = this._tankComponents.track;
        const tankEntity = this._tankComponents.tankEntity;
        if (tankEntity.speed > 0) {
            this._isBraking = true;
            tankEntity.increaseSpeedBy(- (track.movementParameters.backwardAcceleration + resistanceForce));
        }
        else if (-tankEntity.speed < track.movementParameters.finishBackwardSpeed) {
            this._isBraking = false;
            tankEntity.increaseSpeedBy(- (track.movementParameters.backwardAcceleration - resistanceForce));
        }
        tankEntity.calcMovementVector();
        tankEntity.movement();
    }
    public residualMovement(resistanceForce: number) {
        this._isBraking = false;
        const tankEntity = this._tankComponents.tankEntity;
        const speed = tankEntity.speed;
        if (speed > 0)
            tankEntity.increaseSpeedBy(speed - resistanceForce < 0 ? speed : -resistanceForce);
        else
            tankEntity.increaseSpeedBy(speed - resistanceForce > 0 ? speed : resistanceForce);
        tankEntity.calcMovementVector();
        tankEntity.movement();
    }
    public rollback() {
        this._tankComponents.tankEntity.rollback();
    }
}