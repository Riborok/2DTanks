import {TankSpriteParts} from "./TankSpriteParts";
import {Point} from "../model/Point";
import {TankParts} from "../model/tank/TankParts";
import {RectangularEntity} from "../model/IEntity";
import {HULL_HEIGHT, HULL_WIDTH} from "../constants";
import {GeomInteractionUtils} from "../model/GeomInteractionUtils";
import {HullSprite} from "./HullSprite";

export class TankSprite {
    private readonly _tankSpriteParts: TankSpriteParts;
    public constructor(tankSpriteParts: TankSpriteParts) {
        this._tankSpriteParts = tankSpriteParts;
    }
    public get tankSpriteParts(): TankSpriteParts { return this._tankSpriteParts }
    public updateSprites(point: Point, center: Point, hullAngle: number, turretAngle: number) {
        let rotatedPoint = point.clone();
        let halfWidth = this._tankSpriteParts.downTrackSprite.width >> 1;
        let halfHeight = this._tankSpriteParts.downTrackSprite.height >> 1;
        let sin = Math.sin(hullAngle);
        let cos = Math.cos(hullAngle);
        GeomInteractionUtils.rotatePointAroundTarget(
            rotatedPoint,
            new Point(rotatedPoint.x + halfWidth * cos - halfHeight * sin,
                rotatedPoint.y + halfHeight * cos + halfWidth * sin),
            -hullAngle
        );
        this._tankSpriteParts.upTrackSprite.setPosition(rotatedPoint);
        this._tankSpriteParts.upTrackSprite.setAngle(hullAngle);

        rotatedPoint = this._tankSpriteParts.hullSprite.calcPosition(point, hullAngle);
        let tempPoint = rotatedPoint.clone();
        halfWidth = HULL_WIDTH[this._tankSpriteParts.hullSprite.num] >> 1;
        halfHeight = HULL_HEIGHT[this._tankSpriteParts.hullSprite.num] >> 1;
        GeomInteractionUtils.rotatePointAroundTarget(
            rotatedPoint,
            new Point(rotatedPoint.x + halfWidth * cos - halfHeight * sin,
                rotatedPoint.y + halfHeight * cos + halfWidth * sin),
            -hullAngle
        );
        this._tankSpriteParts.hullSprite.setPosition(rotatedPoint);
        this._tankSpriteParts.hullSprite.setAngle(hullAngle);

        rotatedPoint = this._tankSpriteParts.downTrackSprite.calcPosition(tempPoint, hullAngle);
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

    public rotateTurretUpdate(point: Point, turretAngle: number) {
        const turretPoint = this._tankSpriteParts.turretSprite.calcPosition(point, turretAngle);

        this._tankSpriteParts.turretSprite.setPosition(turretPoint);
        this._tankSpriteParts.turretSprite.setAngle(turretAngle);

        this._tankSpriteParts.weaponSprite.setPosition(
            this._tankSpriteParts.weaponSprite.calcPosition(turretPoint, turretAngle));
        this._tankSpriteParts.weaponSprite.setAngle(turretAngle);
    }
}