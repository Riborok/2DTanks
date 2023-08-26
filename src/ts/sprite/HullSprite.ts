import {TankSpritePart} from "./Sprite";
import {ACCELERATION_EFFECT_INDENT_X, HULL_HEIGHT, HULL_WIDTH, TRACK_INDENT} from "../constants/gameConstants";
import {Point} from "../geometry/Point";

export class HullSprite extends TankSpritePart {
    private readonly _accelerationEffectIndentX: number;
    public get accelerationEffectIndentX() { return this._accelerationEffectIndentX }
    public constructor(color: number, num: number) {
        super(HULL_WIDTH[num], HULL_HEIGHT[num]);
        this._accelerationEffectIndentX = ACCELERATION_EFFECT_INDENT_X[num];
        this._sprite.src = `src/img/tanks/Hulls/Hull_${num}/Hull_${color}.png`;
        this._sprite.style.zIndex = `4`;
    }
    /**
     * Calculates the initial position of the hull sprite based on a reference point,
     * while considering the rotation angle represented by sine and cosine values.
     * @param point The reference point, which is the starting point of the top track sprite, for position calculation.
     * @param sin The sine value of the rotation angle.
     * @param cos The cosine value of the rotation angle.
     * @returns The calculated initial position of the hull sprite.
     */
    public override calcPosition(point: Point, sin: number, cos: number): Point {
        return new Point(
            point.x - TRACK_INDENT * sin,
            point.y + TRACK_INDENT * cos
        );
    }
}