import {Sprite} from "../ISprite";
import {ICollectible} from "../../game/bonuses/ICollectible";
import {ResolutionManager} from "../../constants/gameConstants";

enum Bullets{
    bulLight,
    bulMedium,
    bulHeavy,
    bulGrenade,
    bulSniper
}

class BoxSprite extends Sprite{
    constructor(bulletType: Bullets) {
        super(ResolutionManager.BOX_SIZE, ResolutionManager.BOX_SIZE, 1);
        switch (bulletType){
            case Bullets.bulLight:
                this._sprite.src = 'src/img/item/Light_Bullet_Box.png'
                break;
            case Bullets.bulMedium:
                this._sprite.src = 'src/img/item/Medium_Bullet_Box.png'
                break;
            case Bullets.bulHeavy:
                this._sprite.src = 'src/img/item/Heavy_Bullet_Box.png'
                break;
            case Bullets.bulGrenade:
                this._sprite.src = 'src/img/item/Grenade_Bullet_Box.png'
                break;
            case Bullets.bulSniper:
                this._sprite.src = 'src/img/item/Sniper_Bullet_Box.png'
                break;
        }
    }
}