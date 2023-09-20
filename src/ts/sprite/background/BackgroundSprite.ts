import {Sprite} from "../Sprite";
import {ResolutionManager, MATERIAL} from "../../constants/gameConstants";
import {getRandomInt} from "../../additionally/additionalFunc";

export class BackgroundSprite extends Sprite {
    public constructor(materialNum: number) {
        super(ResolutionManager.BACKGROUND_SIZE, ResolutionManager.BACKGROUND_SIZE, `1`);
        this._sprite.src = `src/img/backgrounds/${MATERIAL[materialNum]}_${getRandomInt(0, 1)}.png`;
    }
}