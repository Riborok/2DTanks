import {ITrack} from "./ITrack";
import {ITurret} from "./ITurret";
import {IWeapon} from "./IWeapon";
import {HullEntity} from "./HullEntity";
import {BulletEntity} from "./BulletEntity";
import {IBulletManufacturing} from "./BulletEntity";
import {LightBulletManufacturing} from "./BulletEntity";
import {Point} from "../Point";

class Tank {
    private _track: ITrack;
    private _turret: ITurret;
    private _weapon: IWeapon;
    private _hullEntity: HullEntity;

    private _isDeltaChanged: boolean;
    private _deltaX: number;
    private _deltaY: number;
    private _bulletQuantity: number;
    private _lastTimeShot: number;
    private _bulletManufacturing: IBulletManufacturing;
    public constructor(track: ITrack, turret: ITurret, weapon: IWeapon, hullEntity: HullEntity) {
        this._track = track;
        this._turret = turret;
        this._weapon = weapon;
        this._hullEntity = hullEntity;

        this._bulletQuantity = 0;
        this._isDeltaChanged = false;
        this.calcDeltaCoordinates();
        this._lastTimeShot = Date.now();

        this._bulletManufacturing = new LightBulletManufacturing();
    }

    public shot(): BulletEntity {
        const dateNow = Date.now();
        if (this._bulletQuantity === 0 || dateNow - this._lastTimeShot < this._weapon.reloadSpeed)
            return null;

        const xStart = ((this._hullEntity.points[0].x + this._hullEntity.points[3].x) >> 1) +
            this._weapon.barrelLength * Math.cos(this._turret.angle);
        const yStart = ((this._hullEntity.points[0].y + this._hullEntity.points[3].y) >> 1) +
            this._weapon.barrelLength * Math.sin(this._turret.angle);

        const bulletEntity = this._bulletManufacturing.create(xStart, yStart, this._turret.angle);
        bulletEntity.launchFromWeapon(this._weapon);
        this._lastTimeShot = dateNow;
        this._bulletQuantity--;

        return bulletEntity;
    }
    public incBulletQuantity(quantity: number) {
        this._bulletQuantity = Math.min(this._bulletQuantity + quantity, this._turret.bulletCapacity);
    }
    public takeNewBulletManufacturing(bulletManufacturing: IBulletManufacturing) {
        this._bulletManufacturing = bulletManufacturing;
    }
    public clockwiseMovement() {
        this._isDeltaChanged = true;
        this._hullEntity.rotatePoints(this._track.angleSpeed);
    }
    public counterclockwiseMovement() {
        this._isDeltaChanged = true;
        this._hullEntity.rotatePoints(-this._track.angleSpeed);
    }
    public moveForward() {
        if (this._isDeltaChanged) {
            this._isDeltaChanged = false;
            this.calcDeltaCoordinates();
        }

        this._hullEntity.points.forEach((point: Point) => {
            point.x += this._deltaX;
            point.y += this._deltaY;
        });
    }
    public moveBackward() {
        if (this._isDeltaChanged) {
            this._isDeltaChanged = false;
            this.calcDeltaCoordinates();
        }

        this._hullEntity.points.forEach((point: Point) => {
            point.x -= this._deltaX;
            point.y -= this._deltaY;
        });
    }
    private calcDeltaCoordinates() {
        this._deltaX = this._track.movementSpeed * Math.cos(this._hullEntity.angle);
        this._deltaY = this._track.movementSpeed * Math.sin(this._hullEntity.angle);
    }
}