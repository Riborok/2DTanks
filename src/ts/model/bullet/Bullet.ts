import {IWeapon} from "../tank/tank parts/IWeapon";

export abstract class Bullet {
    public get acceleration(): number { return this._acceleration }
    public get finishSpeed(): number { return this._finishSpeed }
    public get damage(): number { return this._damage }
    public get armorPenetration(): number { return this._armorPenetration }
    public get mass(): number { return this._mass }

    protected abstract _acceleration: number;
    protected abstract _damage: number;
    protected abstract _armorPenetration: number;
    protected abstract _finishSpeed: number;
    protected abstract _mass: number;
    public launchFromWeapon(weapon: IWeapon) {
        this._acceleration *= weapon.accelerationCoeff;
        this._finishSpeed *= weapon.finishSpeedCoeff;
        this._damage *= weapon.damageCoeff;
        this._armorPenetration *= weapon.armorPenetrationCoeff;
    }
}

export class LightBullet extends Bullet {
    protected _armorPenetration: number = 5;
    protected _damage: number = 15;
    protected _acceleration: number = 1.5;
    protected _finishSpeed: number = 15;
    protected _mass: number = 0.0000015;
}