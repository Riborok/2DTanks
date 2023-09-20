import {Sprite} from "../Sprite";
import {MATERIAL, SHAPE, SizeConstants} from "../../constants/gameConstants";
import {Point} from "../../geometry/Point";
import {SpriteManipulator} from "../SpriteManipulator";

export class WallSprite extends Sprite {
    public constructor(materialNum: number, shapeNum: number) {
        super(SizeConstants.WALL_WIDTH[shapeNum], SizeConstants.WALL_HEIGHT[shapeNum], `4`);
        this._sprite.src = `src/img/blocks/${MATERIAL[materialNum]}_${SHAPE[shapeNum]}.png`;
    }
    public updateAfterAction(point: Point, angle: number) {
        point = point.clone();
        SpriteManipulator.rotateToDefaultSpritePoint(this, point, Math.sin(angle), Math.cos(angle));
        SpriteManipulator.setPosAndAngle(this, point, angle);
    }
}