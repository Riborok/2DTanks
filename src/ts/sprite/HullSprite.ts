import {Sprite} from "./Sprite";

export class HullSprite extends Sprite {
    public static readonly WIDTH: number[] = [47, 49, 40, 43, 50, 36, 43, 36];
    public static readonly HEIGHT: number[] = [14, 10, 14, 7, 11, 16, 14, 14];
    public static readonly TURRET_INDENT_X: number[] = [29, 36, 29, 21, 36, 36, 36, 29];
    public constructor(color: number, num: number) {
        super(HullSprite.WIDTH[num], HullSprite.HEIGHT[num]);
        this._sprite.src = `src/img/tanks/Hulls/Hull_${num}/Hull_${color}.png`;
    }
}