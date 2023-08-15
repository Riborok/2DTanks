import {Sprite} from "./Sprite";
import {Point} from "../model/Point";

export class WeaponSprite extends Sprite {
    public static readonly WIDTH: number[] = [47, 49, 40, 43, 50, 36, 43, 36];
    public static readonly HEIGHT: number[] = [14, 10, 14, 7, 11, 16, 14, 14];
    private readonly _indentX : number;
    private readonly _indentY : number;
    public constructor(num: number, indentX: number, indentY: number) {
        super(WeaponSprite.WIDTH[num], WeaponSprite.HEIGHT[num]);
        this._sprite.src = `src/img/tanks/Weapons/Weapon_${num}.png`;
        this._indentX = indentX;
        this._indentY = indentY;
    }
    public calcPosition(point: Point, angle: number): Point {
        return new Point(
            point.x + this._indentX * Math.cos(angle) + this._indentY * Math.sin(angle),
            point.y + this._indentY * Math.cos(angle) - this._indentX * Math.sin(angle)
        );
    }
}