import {BulletEntity, IBulletManufacturing, LightBulletManufacturing} from "./BulletEntity";
import {TankModelParts} from "./TankModelParts";

export class TankModel {
    private readonly _tankParts: TankModelParts;

    private _isDeltaChanged: boolean = false;
    private _bulletQuantity: number = 0;
    private _deltaX: number;
    private _deltaY: number;
    private _lastTimeShot: number;
    private _bulletManufacturing: IBulletManufacturing;
    public constructor(tankParts: TankModelParts) {
        this._tankParts = tankParts;

        this.calcDeltaCoordinates();
        this._lastTimeShot = Date.now();

        this._bulletManufacturing = new LightBulletManufacturing();
    }
    public get tankParts(): TankModelParts { return this._tankParts }
    public shot(): BulletEntity | null {
        const dateNow = Date.now();
        if (this._bulletQuantity === 0 || dateNow - this._lastTimeShot < this._tankParts.weapon.reloadSpeed)
            return null;

        const hullEntity = this._tankParts.hullEntity;
        const xStart = ((hullEntity.points[0].x + hullEntity.points[3].x) >> 1) +
            this._tankParts.weapon.barrelLength * Math.cos(this._tankParts.turret.angle);
        const yStart = ((hullEntity.points[0].y + hullEntity.points[3].y) >> 1) +
            this._tankParts.weapon.barrelLength * Math.sin(this._tankParts.turret.angle);

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
        this._isDeltaChanged = true;
        this._tankParts.hullEntity.rotatePoints(this._tankParts.track.angleSpeed);
        this._tankParts.turret.incAngle(this._tankParts.track.angleSpeed);
    }
    public hullCounterclockwiseMovement() {
        this._isDeltaChanged = true;
        this._tankParts.hullEntity.rotatePoints(-this._tankParts.track.angleSpeed);
        this._tankParts.turret.incAngle(-this._tankParts.track.angleSpeed);
    }
    public moveForward() {
        if (this._isDeltaChanged) {
            this._isDeltaChanged = false;
            this.calcDeltaCoordinates();
        }

        this._tankParts.hullEntity.movePoints(this._deltaX, this._deltaY);
    }
    public moveBackward() {
        if (this._isDeltaChanged) {
            this._isDeltaChanged = false;
            this.calcDeltaCoordinates();
        }

        this._tankParts.hullEntity.movePoints(-this._deltaX, -this._deltaY);
    }
    private calcDeltaCoordinates() {
        this._deltaX = this._tankParts.track.movementSpeed * Math.cos(this._tankParts.hullEntity.angle);
        this._deltaY = this._tankParts.track.movementSpeed * Math.sin(this._tankParts.hullEntity.angle);
    }
}