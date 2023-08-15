import {Sprite} from "./Sprite";
import {HULL_HEIGHT, HULL_WIDTH} from "../constants";

export class HullSprite extends Sprite {
    public constructor(color: number, num: number) {
        super(HULL_WIDTH[num], HULL_HEIGHT[num]);
        this._sprite.src = `src/img/tanks/Hulls/Hull_${num}/Hull_${color}.png`;
    }
}