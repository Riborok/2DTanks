import {Bullet} from "./Bullet";
import {RectangularEntity} from "../entities/IEntity";

export class BulletModel {
    private readonly _bullet: Bullet;
    private readonly _bulletEntity: RectangularEntity;
    public constructor(bullet: Bullet, bulletEntity: RectangularEntity) {
        this._bullet = bullet;
        this._bulletEntity = bulletEntity;
    }
    get bullet(): Bullet { return this._bullet }
    get bulletEntity(): RectangularEntity { return this._bulletEntity }
}