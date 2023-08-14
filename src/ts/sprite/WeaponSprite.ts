import {Sprite} from "./Sprite";
import {Point} from "../model/Point";

export class WeaponSprite extends Sprite {
    private static readonly WIDTH: number[] = [93, 100, 93, 79, 100, 100, 93, 86];
    private static readonly HEIGHT: number[] = [64, 64, 50, 43, 71, 57, 50, 43];
    public constructor(num: number) {
        super(WeaponSprite.WIDTH[num], WeaponSprite.HEIGHT[num]);
        this._sprite.src = `src/img/tanks/Weapons/Weapon_${num}.png`;
    }
}