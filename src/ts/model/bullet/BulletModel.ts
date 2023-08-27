import {Bullet} from "./Bullet";
import {RectangularEntity} from "../entities/IEntity";

export class BulletModel {
    private readonly _bullet: Bullet;
    private readonly _bulletEntity: RectangularEntity;
    public constructor(bullet: Bullet, bulletEntity: RectangularEntity) {
        this._bullet = bullet;
        this._bulletEntity = bulletEntity;
    }
    public get bullet(): Bullet { return this._bullet }
    public get bulletEntity(): RectangularEntity { return this._bulletEntity }
}