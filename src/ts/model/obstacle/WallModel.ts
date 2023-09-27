import {LandModel} from "../Model";
import {IEntity} from "../../polygon/entity/IEntity";

export class WallModel extends LandModel {
    public constructor(entity: IEntity) {
        super(entity, Infinity);
    }
    public get maxHealth(): number { return Infinity }
}