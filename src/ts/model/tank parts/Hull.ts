import {Bullet} from "../bullet/Bullet";

export abstract class Hull {
    protected abstract _health: number;
    protected abstract _armor: number;
    protected abstract _armorStrength: number;
    protected abstract _mass: number;
    public get health() { return this._health }
    public get armor() { return this._armor }
    public get mass() { return this._mass }
    public get armorStrength() { return this._armorStrength }
    public takeDamage(bullet: Bullet) {
        this._armorStrength -= bullet.armorPenetration;
        this._health -= bullet.damage - this._armor * Math.max(this._armorStrength, 0);
    }
}

export class HullModel0 extends Hull {
    protected _mass: number = 1;
    protected _armor: number = 100;
    protected _health: number = 100;
    protected _armorStrength: number = 1;
}