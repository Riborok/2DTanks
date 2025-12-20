import {Sprite} from "../ISprite";
import {MATERIAL, ResolutionManager} from "../../constants/gameConstants";
import {getRandomInt} from "../../additionally/additionalFunc";
import {Point} from "../../geometry/Point";

export class BackgroundSprite extends Sprite {
    public constructor(materialNum: number) {
        const zIndex: number = 0;
        super(ResolutionManager.BACKGROUND_SIZE, ResolutionManager.BACKGROUND_SIZE, zIndex);
        // Use absolute path for webpack dev server (same as UI components)
        const imagePath = `/src/img/backgrounds/${MATERIAL[materialNum]}_${getRandomInt(0, 1)}.png`;
        this._imgSprite.src = imagePath;
        // Initialize point and angle for background (always at origin)
        this._point = new Point(0, 0);
        this._angle = 0;
    }
}