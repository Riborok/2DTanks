import {TankSpritePart} from "./Sprite";
import {Point} from "../model/Point";
import {WEAPON_HEIGHT, WEAPON_WIDTH} from "../constants";

export class WeaponSprite extends TankSpritePart {
    private readonly _indentX : number;
    private readonly _indentY : number;
    public constructor(num: number, indentX: number, indentY: number) {
        super(WEAPON_WIDTH[num], WEAPON_HEIGHT[num]);
        this._sprite.src = `src/img/tanks/Weapons/Weapon_${num}.png`;
        this._indentX = indentX;
        this._indentY = indentY;
    }
    public override calcPosition(point: Point, angle: number): Point {
        return new Point(
            point.x + this._indentX * Math.cos(angle) - this._indentY * Math.sin(angle),
            point.y + this._indentY * Math.cos(angle) + this._indentX * Math.sin(angle)
        );
    }
}