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

        tankSpritePart = this._tankSpriteParts.topTrackSprite;
        rotatedPoint = tankSpritePart.calcPosition(point, sin, cos);
        TankSprite.rotate(tankSpritePart, rotatedPoint, sin, cos);
        TankSprite.setPosAndAngle(tankSpritePart, rotatedPoint, hullAngle);

        tankSpritePart = this._tankSpriteParts.hullSprite;
        rotatedPoint = tankSpritePart.calcPosition(point, sin, cos);
        const hullDefaultPoint = rotatedPoint.clone();
        TankSprite.rotate(tankSpritePart, rotatedPoint, sin, cos);
        TankSprite.setPosAndAngle(tankSpritePart, rotatedPoint, hullAngle);

        tankSpritePart = this._tankSpriteParts.bottomTrackSprite;
        rotatedPoint = tankSpritePart.calcPosition(hullDefaultPoint, sin, cos);
        TankSprite.rotate(tankSpritePart, rotatedPoint, sin, cos);
        TankSprite.setPosAndAngle(tankSpritePart, rotatedPoint, hullAngle);

        this.rotateTurretUpdate(hullDefaultPoint, turretAngle);
    }
    public rotateTurretUpdate(hullDefaultPoint: Point, turretAngle: number) {
        const sin = Math.sin(turretAngle);
        const cos = Math.cos(turretAngle);

        let tankSpritePart: TankSpritePart;
        let rotatedPoint: Point;

        tankSpritePart = this._tankSpriteParts.turretSprite;
        rotatedPoint = tankSpritePart.calcPosition(hullDefaultPoint, sin, cos);
        const turretDefPoint = rotatedPoint.clone();
        TankSprite.rotate(tankSpritePart, rotatedPoint, sin, cos);
        TankSprite.setPosAndAngle(tankSpritePart, rotatedPoint, turretAngle);

        tankSpritePart = this._tankSpriteParts.weaponSprite;
        rotatedPoint = tankSpritePart.calcPosition(turretDefPoint, sin, cos);
        TankSprite.rotate(tankSpritePart, rotatedPoint, sin, cos);
        TankSprite.setPosAndAngle(tankSpritePart, rotatedPoint, turretAngle);
    }
    private static setPosAndAngle(tankSpritePart: TankSpritePart, point: Point, angle: number) {
        tankSpritePart.setPosition(point);
        tankSpritePart.setAngle(angle);
    }
    /**
     * Rotates a point associated with a tank sprite part using the provided sine and cosine values.
     * The function modifies the `point` parameter with the new rotated coordinates.
     * @param tankSpritePart The tank sprite part to which the point belongs.
     * @param point The point to be rotated. Its coordinates will be updated.
     * @param sin The sine value of the rotation angle.
     * @param cos The cosine value of the rotation angle.
     */
    private static rotate(tankSpritePart: TankSpritePart, point: Point, sin: number, cos: number) {
        const halfWidth = tankSpritePart.width >> 1;
        const halfHeight = tankSpritePart.height >> 1;

        // Rotate the figure by the reverse angle to align it to 0 degrees
        // Utilizes the properties of sine and cosine: sin(-a) = -sin(a) and cos(-a) = cos(a)
        GeomInteractionUtils.rotatePointAroundTarget(
            point,
            new Point(point.x + halfWidth * cos - halfHeight * sin,
                point.y + halfHeight * cos + halfWidth * sin),
            -sin, cos
        );
    }
}