import {Sprite} from "./Sprite";
import {Point} from "../geometry/Point";
import {PointRotator} from "../geometry/PointRotator";

export class SpriteManipulator{
    private constructor() {}
    /**
     * Rotates a point associated with a tank parts sprite part using the provided sine and cosine values
     * to the sprite default point (where sprite actually located).
     * The function modifies the `point` parameter with the new rotated coordinates.
     * @param sprite The tank parts sprite part to which the point belongs.
     * @param point The point to be rotated. Its coordinates will be updated.
     * @param sin The sine value of the rotation angle.
     * @param cos The cosine value of the rotation angle.
     */
    public static rotateToDefaultSpritePoint(sprite: Sprite, point: Point, sin: number, cos: number) {
        const halfWidth = sprite.width >> 1;
        const halfHeight = sprite.height >> 1;

        // Rotate the figure by the reverse angle to align it to 0 degrees
        // Utilizes the properties of sine and cosine: sin(-a) = -sin(a) and cos(-a) = cos(a)
        PointRotator.rotatePointAroundTarget(
            point,
            new Point(point.x + halfWidth * cos - halfHeight * sin,
                point.y + halfHeight * cos + halfWidth * sin),
            -sin, cos
        );
    }
    /**
     * Rotates a point associated with a tank parts sprite part using the provided sine and cosine values
     * to the sprite actual point (where we see main point of the sprite).
     * The function modifies the `point` parameter with the new rotated coordinates.
     * @param sprite The tank parts sprite part to which the point belongs.
     * @param point The point to be rotated. Its coordinates will be updated.
     * @param sin The sine value of the rotation angle.
     * @param cos The cosine value of the rotation angle.
     */
    public static rotateToActualSpritePoint(sprite: Sprite, point: Point, sin: number, cos: number) {
        const halfWidth = sprite.width >> 1;
        const halfHeight = sprite.height >> 1;

        // Rotate the figure by the reverse angle to align it to 0 degrees
        // Utilizes the properties of sine and cosine: sin(-a) = -sin(a) and cos(-a) = cos(a)
        PointRotator.rotatePointAroundTarget(
            point,
            new Point(point.x + halfWidth, point.y + halfHeight),
            sin, cos
        );
    }
    /**
     * Updates the position and angle of a sprite, but first sets the point to the "default state".
     * @param sprite The sprite to be updated.
     * @param position The new position for the sprite.
     * @param sin The sine value of the rotation angle.
     * @param cos The cosine value of the rotation angle.
     * @param angle The new angle for the sprite.
     */
    public static updateSpritePart(sprite: Sprite, position: Point, sin: number, cos: number, angle: number) {
        SpriteManipulator.rotateToDefaultSpritePoint(sprite, position, sin, cos);
        SpriteManipulator.setPosAndAngle(sprite, position, angle);
    }
    /**
     * Sets the position and angle of a sprite.
     * @param sprite The sprite to be updated.
     * @param point The new position for the sprite.
     * @param angle The new angle for the sprite.
     */
    public static setPosAndAngle(sprite: Sprite, point: Point, angle: number) {
        sprite.setPosition(point);
        sprite.setAngle(angle);
    }
    /**
     * Rotates a point associated with a turret sprite part relative to a tank parts sprite's hull.
     * The function modifies the `point` parameter with the new rotated coordinates.
     * @param sprite The tank parts sprite part (hull) to which the point belongs.
     * @param point The point to be rotated. Its coordinates will be updated.
     * @param hullSin The sine value of the hull's rotation angle.
     * @param hullCos The cosine value of the hull's rotation angle.
     * @param turretSin The sine value of the turret's rotation angle relative to the hull.
     * @param turretCos The cosine value of the turret's rotation angle relative to the hull.
     */
    public static rotateForTurretPoint(sprite: Sprite, point: Point,
                                        hullSin: number, hullCos: number,
                                        turretSin: number, turretCos: number){
        const halfWidth = sprite.width >> 1;
        const halfHeight = sprite.height >> 1;

        // Rotate the turret by the angle to align top left point to its actual position
        // For optimization, we replace the formulas as follows:
        // - sin(turretAngle - hullAngle) = sin(turretAngle) * cos(hullAngle) - cos(turretAngle) * sin(hullAngle)
        // - cos(turretAngle - hullAngle) = cos(hullAngle) * cos(turretAngle) + sin(hullAngle) * sin(turretAngle)
        PointRotator.rotatePointAroundTarget(
            point,
            new Point(point.x + halfWidth * hullCos - halfHeight * hullSin,
                point.y + halfHeight * hullCos + halfWidth * hullSin),
            turretSin * hullCos - turretCos * hullSin,
            hullCos * turretCos + hullSin * turretSin
        );
    }
}