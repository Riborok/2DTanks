import {Sprite} from "./Sprite";
import {Point} from "../model/Point";

export class WeaponSprite extends Sprite {
    private static readonly WIDTH: number[] = [93, 100, 93, 79, 100, 100, 93, 86];
    private static readonly HEIGHT: number[] = [64, 64, 50, 43, 71, 57, 50, 43];
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