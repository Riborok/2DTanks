import {RectangularEntity} from "../IEntity";
import {BulletEntity} from "./BulletEntity";
import {HULL_HEIGHT, HULL_WIDTH, TRACK_INDENT} from "../../constants/gameConstants";

export abstract class HullEntity extends RectangularEntity {
    protected constructor(x0: number, y0: number, width: number, height: number, angle: number) {
        super(x0, y0, width + TRACK_INDENT, height + (TRACK_INDENT << 1), angle);
    }
    protected abstract _health: number;
    protected abstract _armor: number;
    protected abstract _weight: number;
    protected abstract _armorStrength: number;
    public get health() { return this._health }
    public get armor() { return this._armor }
    public get armorStrength() { return this._armorStrength }
    public get weight() { return this._weight }
    public takeDamage(bullet: BulletEntity) {
        this._armorStrength -= bullet.armorPenetration;
        this._health -= (bullet.damage - this._armor * Math.min(this._armorStrength, 1));
    }
}

export class HullModel0 extends HullEntity{
    protected _armor: number = 100;
    protected _health: number = 100;
    protected _weight: number = 5;
    protected _armorStrength: number = 1;
    public constructor(x0: number, y0: number, angle: number) {
        super(x0, y0, HULL_WIDTH[0], HULL_HEIGHT[0], angle);
    }
}