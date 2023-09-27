import {IBullet} from "../../components/bullet/IBullet";
import {IEntity} from "../../polygon/entity/IEntity";
import {AirModel} from "../Model";
import {IWeapon} from "../../components/tank parts/IWeapon";

export class BulletModel extends AirModel {
    private readonly _damage: number;
    private readonly _armorPenetration: number;
    private readonly _maxHealth: number;
    public constructor(bullet: IBullet, entity: IEntity, weapon: IWeapon) {
        super(entity, bullet.health);

        this._damage = bullet.damage * weapon.damageCoeff;
        this._armorPenetration = bullet.armorPenetration * weapon.armorPenetrationCoeff;
        this._maxHealth = bullet.health;
    }
    public get maxHealth(): number { return this._maxHealth }
    public get damage(): number { return this._damage }
    public get armorPenetration(): number { return this._armorPenetration }
}