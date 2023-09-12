import {IBullet} from "./IBullet";
import {IEntity} from "../entitiy/IEntity";
import {Model} from "../Model";
import {MotionData} from "../../additionally/type";
import {IWeapon} from "../tank/tank parts/IWeapon";

export class BulletModel extends Model {
    private _health: number;

    private readonly _motionData: MotionData;
    private readonly _damage: number;
    private readonly _armorPenetration: number;
    public constructor(bullet: IBullet, entity: IEntity, weapon: IWeapon) {
        super(entity);
        this._health = bullet.health;

        this._motionData.force = bullet.motionData.force * weapon.forceCoeff;
        this._motionData.finishSpeed = bullet.motionData.finishSpeed * weapon.finishSpeedCoeff;
        this._damage = bullet.damage * weapon.damageCoeff;
        this._armorPenetration = bullet.armorPenetration * weapon.armorPenetrationCoeff;
    }
    public takeDamage(bullet: BulletModel): void { this._health -= bullet.damage }
    public get health(): number { return this._health }
    public get damage(): number { return this._damage }
    public get armorPenetration(): number { return this._armorPenetration }
}