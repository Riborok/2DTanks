import {IPolygon} from "../../polygon/IPolygon";
import {Bonus} from "../../constants/gameConstants";

export interface ICollectible extends IPolygon {
    get bonus(): Bonus;
}