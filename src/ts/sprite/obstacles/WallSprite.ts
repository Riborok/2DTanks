import {Sprite} from "../Sprite";
import {MATERIAL, SHAPE, WALL_HEIGHT, WALL_WIDTH} from "../../constants/gameConstants";
import {Point} from "../../geometry/Point";
import {SpriteManipulator} from "../SpriteManipulator";

export class WallSprite extends Sprite {
    public constructor(materialNum: number, shapeNum: number) {
        super(WALL_WIDTH[shapeNum], WALL_HEIGHT[shapeNum]);
        this._sprite.src = `src/img/blocks/${MATERIAL[materialNum]}_${SHAPE[shapeNum]}.png`;
        this._sprite.style.zIndex = `2`;
    }
    public updateAfterAction(point: Point, angle: number) {
        point = point.clone();
        SpriteManipulator.rotateForPoint(this, point, Math.sin(angle), Math.cos(angle));
        SpriteManipulator.setPosAndAngle(this, point, angle);
    }
}