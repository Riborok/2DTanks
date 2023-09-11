import {Bullet} from "./Bullet";
import {IEntity} from "../entitiy/IEntity";
import {Model} from "../Model";

export class BulletModel extends Model {
    private readonly _bullet: Bullet;
    public constructor(bullet: Bullet, entity: IEntity) {
        super(entity);
        this._bullet = bullet;
    }
    public get bullet(): Bullet { return this._bullet }
    public takeDamage(bullet: Bullet): void { this._bullet.takeDamage(bullet) }
    public get health(): number { return this._bullet.health }
}