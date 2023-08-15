import {Sprite} from "./Sprite";

export class HullSprite extends Sprite {
    public static readonly WIDTH: number[] = [93, 100, 93, 79, 100, 100, 93, 86];
    public static readonly HEIGHT: number[] = [64, 64, 50, 43, 71, 57, 50, 43];
    public static readonly TURRET_INDENT_X: number[] = [29, 36, 29, 21, 36, 36, 36, 29];
    public constructor(color: number, num: number) {
        super(HullSprite.WIDTH[num], HullSprite.HEIGHT[num]);
        this._sprite.src = `src/img/tanks/Hulls/Hull_${num}/Hull_${color}.png`;
    }
}