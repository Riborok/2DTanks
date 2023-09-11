import {IWeapon} from "../tank/tank parts/IWeapon";
import {IHealth} from "../vitality/IHealth";
import {MotionData} from "../../additionally/type";

export abstract class Bullet implements IHealth {
    protected abstract _health: number;
    public get motionData(): MotionData { return this._motionData }
    public get damage(): number { return this._damage }
    public get armorPenetration(): number { return this._armorPenetration }
    public get mass(): number { return this._mass }
    public get health(): number { return this._health }
    public takeDamage(bullet: Bullet) { this._health -= bullet._damage }

    protected abstract _motionData: MotionData;
    protected abstract _damage: number;
    protected abstract _armorPenetration: number;
    protected abstract _mass: number;
    public launchFromWeapon(weapon: IWeapon) {
        this._motionData.force *= weapon.forceCoeff;
        this._motionData.finishSpeed *= weapon.finishSpeedCoeff;
        this._damage *= weapon.damageCoeff;
        this._armorPenetration *= weapon.armorPenetrationCoeff;
    }
}

export class LightBullet extends Bullet {
    protected _motionData: MotionData = { force: 1, finishSpeed: 20 };
    protected _armorPenetration: number = 5;
    protected _damage: number = 15;
    protected _mass: number = 0.0000015;
    protected _health: number = 1;
}