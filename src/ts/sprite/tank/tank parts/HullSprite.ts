import {ISpritePart, Sprite} from "../../Sprite";
import {SizeConstants} from "../../../constants/gameConstants";
import {Point} from "../../../geometry/Point";

export class HullSprite extends Sprite implements ISpritePart {
    private readonly _accelerationEffectIndentX: number;
    public get accelerationEffectIndentX() { return this._accelerationEffectIndentX }
    public constructor(color: number, num: number) {
        super(SizeConstants.HULL_WIDTH[num], SizeConstants.HULL_HEIGHT[num], `5`);
        this._accelerationEffectIndentX = SizeConstants.ACCELERATION_EFFECT_INDENT_X[num];
        this._sprite.src = `src/img/tanks/Hulls/Hull_${num}/Hull_${color}.png`;
    }
    /**
     * Calculates the initial position of the hull sprite based on a reference point,
     * while considering the rotation angle represented by sine and cosine values.
     * @param point The reference point, which is the starting point of the top track sprite, for position calculation.
     * @param sin The sine value of the rotation angle.
     * @param cos The cosine value of the rotation angle.
     * @returns The calculated initial position of the hull sprite.
     */
    public calcPosition(point: Point, sin: number, cos: number): Point {
        return new Point(
            point.x - SizeConstants.TRACK_INDENT * sin,
            point.y + SizeConstants.TRACK_INDENT * cos
        );
    }
}