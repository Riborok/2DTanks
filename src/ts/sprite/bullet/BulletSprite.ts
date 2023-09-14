import {Sprite} from "../Sprite";
import {BULLET_HEIGHT, BULLET_WIDTH} from "../../constants/gameConstants";
import {Point} from "../../geometry/Point";
import {SpriteManipulator} from "../SpriteManipulator";

export class BulletSprite extends Sprite {
    public constructor(num: number) {
        super(BULLET_WIDTH[num], BULLET_HEIGHT[num]);
        this._sprite.src = `src/img/tanks/Bullets/Bullet_${num}.png`;
        this._sprite.style.zIndex = `4`;
    }
    public updateAfterAction(point: Point, angle: number) {
        point = point.clone();
        SpriteManipulator.rotateToDefaultSpritePoint(this, point, Math.sin(angle), Math.cos(angle));
        SpriteManipulator.setPosAndAngle(this, point, angle);
    }
}