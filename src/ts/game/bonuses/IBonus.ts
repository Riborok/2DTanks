import {IPolygon} from "../../polygon/IPolygon";

enum Bonus {
    kill = 0,
}

export interface IBonus extends IPolygon {
    get bonus(): Bonus;
}