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
        TankSprite.rotateForPoint(tankSpritePart, rotatedPoint, sin, cos);
        TankSprite.setPosAndAngle(tankSpritePart, rotatedPoint, hullAngle);

        tankSpritePart = this._tankSpriteParts.hullSprite;
        rotatedPoint = tankSpritePart.calcPosition(point, sin, cos);
        const hullDefaultPoint = rotatedPoint.clone();
        TankSprite.rotateForPoint(tankSpritePart, rotatedPoint, sin, cos);
        TankSprite.setPosAndAngle(tankSpritePart, rotatedPoint, hullAngle);

        tankSpritePart = this._tankSpriteParts.bottomTrackSprite;
        rotatedPoint = tankSpritePart.calcPosition(hullDefaultPoint, sin, cos);
        TankSprite.rotateForPoint(tankSpritePart, rotatedPoint, sin, cos);
        TankSprite.setPosAndAngle(tankSpritePart, rotatedPoint, hullAngle);

        this.rotateTurretUpdate(hullDefaultPoint, turretAngle, sin, cos);
    }
    public rotateTurretUpdate(hullDefaultPoint: Point, turretAngle: number, hullSin: number, hullCos: number) {
        const turretSin = Math.sin(turretAngle);
        const turretCos = Math.cos(turretAngle);

        let tankSpritePart: TankSpritePart;
        let rotatedPoint: Point;

        tankSpritePart = this._tankSpriteParts.turretSprite;
        rotatedPoint = tankSpritePart.calcPosition(hullDefaultPoint, hullSin, hullCos);
        let turretDefPoint = rotatedPoint.clone();
        TankSprite.rotateForTurretPoint(tankSpritePart, turretDefPoint,
            hullSin, hullCos, turretSin, turretCos);
        TankSprite.rotateForPoint(tankSpritePart, rotatedPoint, hullSin, hullCos);
        TankSprite.setPosAndAngle(tankSpritePart, rotatedPoint, turretAngle);

        tankSpritePart = this._tankSpriteParts.weaponSprite;
        rotatedPoint = tankSpritePart.calcPosition(turretDefPoint, turretSin, turretCos);
        TankSprite.rotateForPoint(tankSpritePart, rotatedPoint, turretSin, turretCos);
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
    private static rotateForPoint(tankSpritePart: TankSpritePart, point: Point, sin: number, cos: number) {
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
    /**
     * Rotates a point associated with a turret sprite part relative to a tank sprite's hull.
     * The function modifies the `point` parameter with the new rotated coordinates.
     * @param tankSpritePart The tank sprite part (hull) to which the point belongs.
     * @param point The point to be rotated. Its coordinates will be updated.
     * @param hullSin The sine value of the hull's rotation angle.
     * @param hullCos The cosine value of the hull's rotation angle.
     * @param turretSin The sine value of the turret's rotation angle relative to the hull.
     * @param turretCos The cosine value of the turret's rotation angle relative to the hull.
     */
    private static rotateForTurretPoint(tankSpritePart: TankSpritePart, point: Point,
                                        hullSin: number, hullCos: number,
                                        turretSin: number, turretCos: number){
        const halfWidth = tankSpritePart.width >> 1;
        const halfHeight = tankSpritePart.height >> 1;

        // Rotate the turret by the angle to align top left point to its actual position
        // For optimization, we replace the formulas as follows:
        // - sin(turretAngle - hullAngle) = sin(turretAngle) * cos(hullAngle) - cos(turretAngle) * sin(hullAngle)
        // - cos(turretAngle - hullAngle) = cos(hullAngle) * cos(turretAngle) + sin(hullAngle) * sin(turretAngle)
        GeomInteractionUtils.rotatePointAroundTarget(
            point,
            new Point(point.x + halfWidth * hullCos - halfHeight * hullSin,
                point.y + halfHeight * hullCos + halfWidth * hullSin),
            turretSin * hullCos - turretCos * hullSin,
            hullCos * turretCos + hullSin * turretSin
        );
    }
}