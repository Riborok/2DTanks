import { gameImg } from '../../constants/gameAssets';
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
                this._imgSprite.src = gameImg('item/Light_Bullet_Box.png');
                break;
            case Bonus.bulMedium:
                this._imgSprite.src = gameImg('item/Medium_Bullet_Box.png');
                break;
            case Bonus.bulHeavy:
                this._imgSprite.src = gameImg('item/Heavy_Bullet_Box.png');
                break;
            case Bonus.bulGrenade:
                this._imgSprite.src = gameImg('item/Grenade_Bullet_Box.png');
                break;
            case Bonus.bulSniper:
                this._imgSprite.src = gameImg('item/Sniper_Bullet_Box.png');
                break;
            case Bonus.perkShield:
                this._imgSprite.src = gameImg('item/Perk_Shield.png');
                break;
            default:
                throw new Error(`Unsupported bulletType: ${bulletType}`);
        }
    }
}