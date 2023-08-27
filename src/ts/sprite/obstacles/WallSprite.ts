import {Sprite} from "../Sprite";
import {MATERIAL, SHAPE, WALL_HEIGHT, WALL_WIDTH} from "../../constants/gameConstants";

export class WallSprite extends Sprite {
    public constructor(materialNum: number, shapeNum: number) {
        super(WALL_WIDTH[shapeNum], WALL_HEIGHT[shapeNum]);
        this._sprite.src = `src/img/blocks/${MATERIAL[materialNum]}_${SHAPE[shapeNum]}.png`;
        this._sprite.style.zIndex = `2`;
    }
}