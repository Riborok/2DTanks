import {ILandModel, LandModel} from "../IModel";
import {IEntity} from "../../polygon/entity/IEntity";

export interface IWallModel extends ILandModel {
}

export class WallModel extends LandModel implements IWallModel {
    public constructor(entity: IEntity) {
        super(entity, Infinity);
    }
    
    public get maxHealth(): number { return Infinity }
}


