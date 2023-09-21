import {ISpritePart, Sprite} from "../../Sprite";
import {Point} from "../../../geometry/Point";
import {ResolutionManager} from "../../../constants/gameConstants";

export class WeaponSprite extends Sprite implements ISpritePart {
    private readonly _indentX : number;
    private readonly _indentY : number;
    public constructor(num: number, indentX: number, indentY: number) {
        super(ResolutionManager.WEAPON_WIDTH[num], ResolutionManager.WEAPON_HEIGHT[num], 5);
        this._sprite.src = `src/img/tanks/Weapons/Weapon_${num}.png`;
        this._indentX = indentX;
        this._indentY = indentY;
    }
    /**
     * Calculates the initial position of the weapon sprite based on a reference point,
     * while considering the rotation angle represented by sine and cosine values.
     * @param point The reference point, which is the starting point of the turret, for position calculation.
     * @param sin The sine value of the rotation angle.
     * @param cos The cosine value of the rotation angle.
     * @returns The calculated initial position of the weapon sprite.
     */
    public calcPosition(point: Point, sin: number, cos: number): Point {
        return new Point(
            point.x + this._indentX * cos - this._indentY * sin,
            point.y + this._indentY * cos + this._indentX * sin
        );
    }
}