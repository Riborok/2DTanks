import {IPolygon} from "../../polygon/IPolygon";
import {Bonus} from "./Bonus";

export interface ICollectible extends IPolygon {
    get bonus(): Bonus;
}