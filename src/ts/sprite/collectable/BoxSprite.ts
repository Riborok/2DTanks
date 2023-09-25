import {Sprite} from "../ISprite";
import {ResolutionManager} from "../../constants/gameConstants";
import {Point} from "../../geometry/Point";

enum Bullets{
    bulLight,
    bulMedium,
    bulHeavy,
    bulGrenade,
    bulSniper
}

export class BoxSprite extends Sprite{
    constructor(bulletType: Bullets, point: Point, angle: number) {
        super(ResolutionManager.BOX_SIZE, ResolutionManager.BOX_SIZE, 1);
        this._point = point;
        this._angle = angle;
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