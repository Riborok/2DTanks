import {Sprite} from "../ISprite";
import {MATERIAL, ResolutionManager} from "../../constants/gameConstants";
import {getRandomInt} from "../../additionally/additionalFunc";

export class BackgroundSprite extends Sprite {
    public constructor(materialNum: number) {
        const zIndex: number = 0;
        super(ResolutionManager.BACKGROUND_SIZE, ResolutionManager.BACKGROUND_SIZE, zIndex);
        this._imgSprite.src = `src/img/backgrounds/${MATERIAL[materialNum]}_${getRandomInt(0, 1)}.png`;
    }
}