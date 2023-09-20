import {Sprite} from "../Sprite";
import {SizeConstants} from "../../constants/gameConstants";
import {Point} from "../../geometry/Point";
import {SpriteManipulator} from "../SpriteManipulator";

export class BulletSprite extends Sprite {
    private readonly _num: number;
    public get num(): number { return this._num };
    public constructor(num: number) {
        super(SizeConstants.BULLET_WIDTH[num], SizeConstants.BULLET_HEIGHT[num], `4`);
        this._sprite.src = `src/img/tanks/Bullets/Bullet_${num}.png`;
        this._num = num;
    }
    public updateAfterAction(point: Point, angle: number) {
        point = point.clone();
        SpriteManipulator.rotateToDefaultSpritePoint(this, point, Math.sin(angle), Math.cos(angle));
        SpriteManipulator.setPosAndAngle(this, point, angle);
    }
}