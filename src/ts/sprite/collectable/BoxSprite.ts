import {Sprite} from "../ISprite";
import {Bonus, ResolutionManager} from "../../constants/gameConstants";
import {Point} from "../../geometry/Point";

export class BoxSprite extends Sprite{
    public constructor(bulletType: Bonus, point: Point, angle: number) {
        const zIndex: number = 6;
        super(ResolutionManager.BOX_SIZE, ResolutionManager.BOX_SIZE, zIndex);
        this._point = point;
        this._angle = angle;
        switch (bulletType){
            case Bonus.bulLight:
                this._imgSprite.src = 'src/img/item/Light_Bullet_Box.png'
                break;
            case Bonus.bulMedium:
                this._imgSprite.src = 'src/img/item/Medium_Bullet_Box.png'
                break;
            case Bonus.bulHeavy:
                this._imgSprite.src = 'src/img/item/Heavy_Bullet_Box.png'
                break;
            case Bonus.bulGrenade:
                this._imgSprite.src = 'src/img/item/Grenade_Bullet_Box.png'
                break;
            case Bonus.bulSniper:
                this._imgSprite.src = 'src/img/item/Sniper_Bullet_Box.png'
                break;
            default:
                throw new Error(`Unsupported bulletType: ${bulletType}`);
        }
    }
}