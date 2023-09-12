import {Model} from "../Model";
import {IEntity} from "../../entitiy/IEntity";
import {BulletModel} from "../bullet/BulletModel";

export class WallModel extends Model {
    private _health: number = Infinity;
    public constructor(entity: IEntity) {
        super(entity);
    }
    public takeDamage(bullet: BulletModel): void { this._health -= bullet.damage }
    public get health(): number { return this._health }
}