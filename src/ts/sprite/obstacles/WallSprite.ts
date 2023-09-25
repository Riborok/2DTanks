import {Sprite} from "../ISprite";
import {MATERIAL, ResolutionManager, SHAPE} from "../../constants/gameConstants";
import {Point} from "../../geometry/Point";
import {SpriteManipulator} from "../SpriteManipulator";

export class WallSprite extends Sprite {
    public constructor(materialNum: number, shapeNum: number) {
        const zIndex: number = 3;
        super(ResolutionManager.WALL_WIDTH[shapeNum], ResolutionManager.WALL_HEIGHT[shapeNum], zIndex);
        this._sprite.src = `src/img/blocks/${MATERIAL[materialNum]}_${SHAPE[shapeNum]}.png`;
    }
    public updateAfterAction(point: Point, angle: number) {
        point = point.clone();
        SpriteManipulator.rotateToDefaultSpritePoint(this, point, Math.sin(angle), Math.cos(angle));
        SpriteManipulator.setPosAndAngle(this, point, angle);
    }
}