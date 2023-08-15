import {TankSpriteParts} from "./TankSpriteParts";
import {Point} from "../model/Point";

export class TankSprite {
    private readonly _tankSpriteParts: TankSpriteParts;
    public constructor(tankSpriteParts: TankSpriteParts) {
        this._tankSpriteParts = tankSpriteParts;
    }

    public movementUpdate(point: Point, hullAngle: number, turretAngle: number) {
        this._tankSpriteParts.hullSprite.setPosition(point);

        this._tankSpriteParts.downTrackSprite.setPosition(
            this._tankSpriteParts.downTrackSprite.calcPosition(point, hullAngle));
        this._tankSpriteParts.upTrackSprite.setPosition(
            this._tankSpriteParts.upTrackSprite.calcPosition(point, hullAngle));

        const turretPoint = this._tankSpriteParts.turretSprite.calcPosition(point, turretAngle);
        this._tankSpriteParts.turretSprite.setPosition(turretPoint);
        this._tankSpriteParts.weaponSprite.setPosition(
            this._tankSpriteParts.weaponSprite.calcPosition(turretPoint, turretAngle));
    }

    public rotateTurretUpdate(point: Point, turretAngle: number) {
        const turretPoint = this._tankSpriteParts.turretSprite.calcPosition(point, turretAngle);

        this._tankSpriteParts.turretSprite.setPosition(turretPoint);
        this._tankSpriteParts.turretSprite.setAngle(turretAngle);

        this._tankSpriteParts.weaponSprite.setPosition(
            this._tankSpriteParts.weaponSprite.calcPosition(turretPoint, turretAngle));
        this._tankSpriteParts.weaponSprite.setAngle(turretAngle);
    }

    public rotateHullUpdate(point: Point, hullAngle: number, turretAngle: number) {
        this._tankSpriteParts.hullSprite.setAngle(hullAngle);

        this._tankSpriteParts.downTrackSprite.setPosition(
            this._tankSpriteParts.downTrackSprite.calcPosition(point, hullAngle));
        this._tankSpriteParts.downTrackSprite.setAngle(hullAngle);

        this._tankSpriteParts.upTrackSprite.setPosition(
            this._tankSpriteParts.upTrackSprite.calcPosition(point, hullAngle));
        this._tankSpriteParts.upTrackSprite.setAngle(hullAngle);

        this.rotateTurretUpdate(point, turretAngle);
    }
}