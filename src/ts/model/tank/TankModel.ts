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
    public constructor(tankParts: TankModelParts) {
        this._tankParts = tankParts;
        this._lastTimeShot = Date.now();
        this._currentSpeed = tankParts.track.initialMovementSpeed;

        this._bulletManufacturing = new LightBulletManufacturing();
    }
    public braking() { this._currentSpeed = this._tankParts.track.initialMovementSpeed; }
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
    public hullClockwiseMovement() {
        this._tankParts.hullEntity.rotatePoints(this._tankParts.track.angleSpeed);
        this._tankParts.turret.incAngle(this._tankParts.track.angleSpeed);
    }
    public hullCounterclockwiseMovement() {
        this._tankParts.hullEntity.rotatePoints(-this._tankParts.track.angleSpeed);
        this._tankParts.turret.incAngle(-this._tankParts.track.angleSpeed);
    }
    public forwardMovement() {
        const track = this._tankParts.track;
        if (this._currentSpeed < track.finishMovementSpeed)
            this._currentSpeed += track.MovementAcceleration;

        this.calcDeltaCoordinates(this._currentSpeed);
        this._tankParts.hullEntity.movePoints(this._deltaX, this._deltaY);
    }
    public backwardMovement() {
        this.calcDeltaCoordinates(-this._tankParts.track.initialMovementSpeed);
        this._tankParts.hullEntity.movePoints(this._deltaX, this._deltaY);
    }
    public rollback() {
        this._tankParts.hullEntity.movePoints(-this._deltaX, -this._deltaY);
    }
    private calcDeltaCoordinates(speed: number){
        this._deltaX = speed * TrigCache.getCos(this._tankParts.hullEntity.angle);
        this._deltaY = speed * TrigCache.getSin(this._tankParts.hullEntity.angle);
    }
}