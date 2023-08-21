import {TankSpriteParts} from "./TankSpriteParts";
import {Point} from "../model/Point";
import {GeomInteractionUtils} from "../model/GeomInteractionUtils";
import {TankSpritePart} from "./Sprite";

export class TankSprite {
    private readonly _tankSpriteParts: TankSpriteParts;
    public constructor(tankSpriteParts: TankSpriteParts) {
        this._tankSpriteParts = tankSpriteParts;
    }
    public get tankSpriteParts(): TankSpriteParts { return this._tankSpriteParts }
    public updateSprite(point: Point, hullAngle: number, turretAngle: number) {
        const sin = Math.sin(hullAngle);
        const cos = Math.cos(hullAngle);

        let tankSpritePart: TankSpritePart;
        let rotatedPoint: Point;

        tankSpritePart = this._tankSpriteParts.upTrackSprite;
        rotatedPoint = tankSpritePart.calcPosition(point, hullAngle);
        TankSprite.rotate(tankSpritePart, rotatedPoint, hullAngle, sin, cos);
        TankSprite.setPosAndAngle(tankSpritePart, rotatedPoint, hullAngle);

        tankSpritePart = this._tankSpriteParts.hullSprite;
        rotatedPoint = tankSpritePart.calcPosition(point, hullAngle);
        const hullDefaultPoint = rotatedPoint.clone();
        TankSprite.rotate(tankSpritePart, rotatedPoint, hullAngle, sin, cos);
        TankSprite.setPosAndAngle(tankSpritePart, rotatedPoint, hullAngle);

        tankSpritePart = this._tankSpriteParts.downTrackSprite;
        rotatedPoint = tankSpritePart.calcPosition(hullDefaultPoint, hullAngle);
        TankSprite.rotate(tankSpritePart, rotatedPoint, hullAngle, sin, cos);
        TankSprite.setPosAndAngle(tankSpritePart, rotatedPoint, hullAngle);

        this.rotateTurretUpdate(hullDefaultPoint, turretAngle);
    }
    public rotateTurretUpdate(hullDefaultPoint: Point, turretAngle: number) {
        const sin = Math.sin(turretAngle);
        const cos = Math.cos(turretAngle);

        let tankSpritePart: TankSpritePart;
        let rotatedPoint: Point;

        tankSpritePart = this._tankSpriteParts.turretSprite;
        rotatedPoint = tankSpritePart.calcPosition(hullDefaultPoint, turretAngle);
        const turretDefPoint = rotatedPoint.clone();
        TankSprite.rotate(tankSpritePart, rotatedPoint, turretAngle, sin, cos);
        TankSprite.setPosAndAngle(tankSpritePart, rotatedPoint, turretAngle);

        tankSpritePart = this._tankSpriteParts.weaponSprite;
        rotatedPoint = tankSpritePart.calcPosition(turretDefPoint, turretAngle);
        TankSprite.rotate(tankSpritePart, rotatedPoint, turretAngle, sin, cos);
        TankSprite.setPosAndAngle(tankSpritePart, rotatedPoint, turretAngle);
    }
    private static setPosAndAngle(tankSpritePart: TankSpritePart, point: Point, angle: number) {
        tankSpritePart.setPosition(point);
        tankSpritePart.setAngle(angle);
    }
    // CHANGE POINT VALUE
    private static rotate(tankSpritePart: TankSpritePart, point: Point, angle: number, sin: number, cos: number) {
        const halfWidth = tankSpritePart.width >> 1;
        const halfHeight = tankSpritePart.height >> 1;
        GeomInteractionUtils.rotatePointAroundTarget(
            point,
            new Point(point.x + halfWidth * cos - halfHeight * sin,
                point.y + halfHeight * cos + halfWidth * sin),
            -angle
        );
    }
}