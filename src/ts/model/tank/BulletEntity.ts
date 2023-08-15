import {RectangularEntity} from "../IEntity";
import {IWeapon} from "./IWeapon";

export abstract class BulletEntity extends RectangularEntity{
    public get movementSpeed(): number { return this._movementSpeed }
    public get damage(): number { return this._damage }
    public get armorPenetration(): number { return this._armorPenetration }

    protected abstract _movementSpeed: number;
    protected abstract _damage: number;
    protected abstract _armorPenetration: number;
    protected constructor(x0: number, y0: number, width: number, height: number, angle: number) {
        super(x0, y0, width, height, angle);
    }
    public launchFromWeapon(weapon: IWeapon) {
        this._movementSpeed *= weapon.movementSpeedCoeff;
        this._damage *= weapon.damageCoeff;
        this._armorPenetration *= weapon.armorPenetrationCoeff;
    }
}

export interface IBulletManufacturing {
    create(x0: number, y0: number, angle: number): BulletEntity;
}

class LightBullet extends BulletEntity {
    public static readonly WIDTH: number = 20;
    public static readonly HEIGHT: number = 45;

    protected _armorPenetration: number = 5;
    protected _damage: number = 15;
    protected _movementSpeed: number = 50;
    public constructor(x0: number, y0: number, angle: number) {
        super(x0, y0, LightBullet.WIDTH, LightBullet.HEIGHT, angle);
    }
}

export class LightBulletManufacturing implements IBulletManufacturing{
    public create(x0: number, y0: number, angle: number): BulletEntity {
        return new LightBullet(x0, y0, angle);
    }
}