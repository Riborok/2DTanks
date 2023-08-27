import {Sprite} from "../Sprite";
import {BACKGROUND_SIZE, MATERIAL, SHAPE, WALL_HEIGHT, WALL_WIDTH} from "../../constants/gameConstants";
import {getRandomInt} from "../../additionally/additionalFunc";

export class BackgroundSprite extends Sprite {
    public constructor(materialNum: number) {
        super(BACKGROUND_SIZE, BACKGROUND_SIZE);
        this._sprite.src = `src/img/backgrounds/${MATERIAL[materialNum]}_${getRandomInt(0, 1)}.png`;
        this._sprite.style.zIndex = `1`;
    }
}