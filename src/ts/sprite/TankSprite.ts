import {TankSpriteParts} from "./TankSpriteParts";
import {Point} from "../model/Point";
import {TankParts} from "../model/tank/TankParts";
import {RectangularEntity} from "../model/IEntity";
import {HULL_HEIGHT, HULL_WIDTH} from "../constants";
import {GeomInteractionUtils} from "../model/GeomInteractionUtils";

export class TankSprite {
    private readonly _tankSpriteParts: TankSpriteParts;
    public constructor(tankSpriteParts: TankSpriteParts) {
        this._tankSpriteParts = tankSpriteParts;
    }
    public get tankSpriteParts(): TankSpriteParts { return this._tankSpriteParts }
    public display(point: Point, center: Point, hullAngle: number, turretAngle: number) {
        let rotatedPoint = point.clone();
        GeomInteractionUtils.rotatePointAroundTarget(rotatedPoint, center, -hullAngle);
        this._tankSpriteParts.hullSprite.setPosition(rotatedPoint);
        this._tankSpriteParts.hullSprite.setAngle(hullAngle);

        this.downTrackUpdate(point, hullAngle);
    }

    public movementUpdate(point: Point, center: Point, hullAngle: number, turretAngle: number) {
        let rotatedPoint = point.clone();
        GeomInteractionUtils.rotatePointAroundTarget(rotatedPoint, center, -hullAngle);
        this._tankSpriteParts.hullSprite.setPosition(rotatedPoint);

        this.downTrackUpdate(point, hullAngle);
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
        this._tankSpriteParts.hullSprite.setAngle(hullAngle);

        this.downTrackUpdate(point, hullAngle);
    }

    private downTrackUpdate(point: Point, hullAngle: number){
        let sin, cos, halfWidth, halfHeight: number;

        sin = Math.sin(hullAngle);
        cos = Math.cos(hullAngle);

        let rotatedPoint = this._tankSpriteParts.downTrackSprite.calcPosition(point, hullAngle);

        halfWidth = this._tankSpriteParts.downTrackSprite.width >> 1;
        halfHeight = this._tankSpriteParts.downTrackSprite.height >> 1;
        GeomInteractionUtils.rotatePointAroundTarget(
            rotatedPoint,
            new Point(rotatedPoint.x + halfWidth * cos - halfHeight * sin,
                rotatedPoint.y + halfHeight * cos + halfWidth * sin),
            -hullAngle
        );
        this._tankSpriteParts.downTrackSprite.setPosition(rotatedPoint);
        this._tankSpriteParts.downTrackSprite.setAngle(hullAngle);
    }
}