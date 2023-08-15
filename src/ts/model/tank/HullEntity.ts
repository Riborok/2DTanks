import {RectangularEntity} from "../IEntity";
import {BulletEntity} from "./BulletEntity";

export abstract class HullEntity extends RectangularEntity {
    protected constructor(x0: number, y0: number, width: number, height: number, angle: number) {
        super(x0, y0, width, height, angle);
    }
    protected abstract _health: number;
    protected abstract _armor: number;
    protected _armorStrength: number = 1; // 0 to 1
    public get health(){return this._health};
    public get armor(){return this._armor};
    public get armorStrength(){return this._armorStrength};
    public takeDamage(bullet: BulletEntity) {
        this._armorStrength -= bullet.armorPenetration;
        this._health -= (bullet.damage - this._armor * this._armorStrength);
    }
}

class HullModel0 extends HullEntity{
    protected _armor: number = 100;
    protected _health: number = 100;
}