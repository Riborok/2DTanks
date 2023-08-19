import {TankSpriteParts} from "./TankSpriteParts";
import {Point} from "../model/Point";
import {GeomInteractionUtils} from "../model/GeomInteractionUtils";

export class TankSprite {
    private readonly _tankSpriteParts: TankSpriteParts;
    public constructor(tankSpriteParts: TankSpriteParts) {
        this._tankSpriteParts = tankSpriteParts;
    }
    public get tankSpriteParts(): TankSpriteParts { return this._tankSpriteParts }
    public display(point: Point, hullAngle: number, turretAngle: number) {
        this._tankSpriteParts.hullSprite.setPosition(point);
        this._tankSpriteParts.hullSprite.setAngle(hullAngle);
    }

    public movementUpdate(point: Point, center: Point, hullAngle: number, turretAngle: number) {
        point = point.clone();
        GeomInteractionUtils.rotatePointAroundTarget(
            point,
            center,
            -hullAngle
        );

        this._tankSpriteParts.hullSprite.setPosition(point);
        this._tankSpriteParts.hullSprite.setAngle(hullAngle);
    }

    public rotateTurretUpdate(point: Point, turretAngle: number) {
        const turretPoint = this._tankSpriteParts.turretSprite.calcPosition(point, turretAngle);

        this._tankSpriteParts.turretSprite.setPosition(turretPoint);
        this._tankSpriteParts.turretSprite.setAngle(turretAngle);

        this._tankSpriteParts.weaponSprite.setPosition(
            this._tankSpriteParts.weaponSprite.calcPosition(turretPoint, turretAngle));
        this._tankSpriteParts.weaponSprite.setAngle(turretAngle);
    }

    public rotateHullUpdate(point: Point, center: Point, hullAngle: number, turretAngle: number) {
        point = point.clone();
        GeomInteractionUtils.rotatePointAroundTarget(
            point,
            center,
            -hullAngle
        );

        this._tankSpriteParts.hullSprite.setAngle(hullAngle);
        this._tankSpriteParts.hullSprite.setPosition(point);
    }
}