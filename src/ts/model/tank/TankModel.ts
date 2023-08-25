import {BulletEntity, IBulletManufacturing, LightBulletManufacturing} from "./BulletEntity";
import {TankModelParts} from "./TankModelParts";
import {TrigCache} from "../../additionally/LRUCache";

export class TankModel {
    private readonly _tankParts: TankModelParts;

    private _bulletQuantity: number = 0;
    private _lastTimeShot: number;
    private _bulletManufacturing: IBulletManufacturing;
    private _currentSpeed: number;
    private _deltaX: number;
    private _deltaY: number;
    private _isBraking: boolean;
    public constructor(tankParts: TankModelParts) {
        this._tankParts = tankParts;
        this._lastTimeShot = Date.now();
        this._currentSpeed = 0;
        this._isBraking = false;

        this._bulletManufacturing = new LightBulletManufacturing();
    }
    public isIdle(): boolean { return  this._currentSpeed === 0 }
    public stop() { this._currentSpeed = 0 }
    public get tankParts(): TankModelParts { return this._tankParts }
    public shot(): BulletEntity | null {
        const dateNow = Date.now();
        if (this._bulletQuantity === 0 || dateNow - this._lastTimeShot < this._tankParts.weapon.reloadSpeed)
            return null;

        const hullEntity = this._tankParts.hullEntity;
        const xStart = ((hullEntity.points[0].x + hullEntity.points[2].x) >> 1) +
            this._tankParts.weapon.barrelLength * TrigCache.getCos(this._tankParts.turret.angle);
        const yStart = ((hullEntity.points[0].y + hullEntity.points[2].y) >> 1) +
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

        if (this._currentSpeed !== 0) {
            const speedModule = Math.abs(this._currentSpeed);
            const speedFactor = 1 - speedModule /
                (this._tankParts.track.movementParameters.finishForwardSpeed * 8);
            const massFactor = 1 - this._tankParts.mass / 10;
            angleSpeed *= massFactor * speedFactor;
            if (this._isBraking)
                angleSpeed *= (1 + speedModule / 7)
            else
                this._currentSpeed *= (1 - massFactor * angleSpeed);
        }
        return angleSpeed;
    }
    public rollback() {
        this._tankParts.hullEntity.movePoints(-this._deltaX, -this._deltaY);
    }
    public forwardMovement(resistanceForce: number) {
        const track = this._tankParts.track;
        if (this._currentSpeed < 0) {
            this._isBraking = true;
            this._currentSpeed += track.movementParameters.forwardAcceleration + resistanceForce;
        }
        else if (this._currentSpeed < track.movementParameters.finishForwardSpeed) {
            this._isBraking = false;
            this._currentSpeed += track.movementParameters.forwardAcceleration - resistanceForce;
        }
        this.movement();
    }
    public backwardMovement(resistanceForce: number) {
        const track = this._tankParts.track;
        if (this._currentSpeed > 0) {
            this._isBraking = true;
            this._currentSpeed -= (track.movementParameters.backwardAcceleration + resistanceForce);
        }
        else if (-this._currentSpeed < track.movementParameters.finishBackwardSpeed) {
            this._isBraking = false;
            this._currentSpeed -= (track.movementParameters.backwardAcceleration - resistanceForce);
        }
        this.movement();
    }
    public residualMovement(resistanceForce: number) {
        this._isBraking = false;
        if (this._currentSpeed > 0) {
            this._currentSpeed -= resistanceForce;
            if (this._currentSpeed < 0)
                this._currentSpeed = 0;
        }
        else {
            this._currentSpeed += resistanceForce;
            if (this._currentSpeed > 0)
                this._currentSpeed = 0;
        }
        this.movement();
    }
    private movement() {
        this.calcDeltaCoordinates();
        this._tankParts.hullEntity.movePoints(this._deltaX, this._deltaY);
    }
    private calcDeltaCoordinates(){
        this._deltaX = this._currentSpeed * TrigCache.getCos(this._tankParts.hullEntity.angle);
        this._deltaY = this._currentSpeed * TrigCache.getSin(this._tankParts.hullEntity.angle);
    }
}