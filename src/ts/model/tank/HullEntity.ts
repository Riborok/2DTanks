import {RectangularEntity} from "../IEntity";
import {BulletEntity} from "./BulletEntity";

export abstract class HullEntity extends RectangularEntity {
    protected constructor(x0: number, y0: number, width: number, height: number, angle: number) {
        super(x0, y0, width, height, angle);
    }
    protected abstract _health: number;
    protected abstract _armor: number;
    protected abstract _armorStrength: number; // 0 to 1
    public takeDamage(bullet: BulletEntity) {
        this._armorStrength -= bullet.armorPenetration;
        this._health -= (bullet.damage - this._armor * this._armorStrength);
    }
}