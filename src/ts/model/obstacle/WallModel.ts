import {LandModel} from "../Model";
import {IEntity} from "../../entitiy/IEntity";

export class WallModel extends LandModel {
    public constructor(entity: IEntity) {
        super(entity, Infinity);
    }
}