import {IBullet, IExplosiveBullet, isImplementsIExplosiveBullet} from "../../components/bullet/IBullet";
import {IEntity} from "../../polygon/entity/IEntity";
import {AirModel, IAirModel} from "../IModel";

export interface IBulletModel extends IAirModel {
    get damage(): number;
    get armorPenetration(): number;
    get isExplosiveBullet(): IExplosiveBullet | null;
}

export class BulletModel extends AirModel implements IBulletModel {
    private readonly _bullet: IBullet;
    
    public constructor(bullet: IBullet, entity: IEntity) {
        super(entity, bullet.health);
        this._bullet = bullet;
    }
    
    public get maxHealth(): number { return this._bullet.health }
    public get damage(): number { return this._bullet.damage }
    public get armorPenetration(): number { return this._bullet.armorPenetration }
    
    public get isExplosiveBullet(): IExplosiveBullet | null {
        const bullet = this._bullet;
        if (isImplementsIExplosiveBullet(bullet))
            return bullet;
        return null;
    }
}


