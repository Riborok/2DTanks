import {RectangularEntity} from "./IEntity";
import {HULL_HEIGHT, HULL_WIDTH, TRACK_INDENT} from "../../constants/gameConstants";

export class TankEntity extends RectangularEntity {
    public constructor(x0: number, y0: number, hullNum: number, angle: number, mass: number) {
        super(x0, y0, HULL_WIDTH[hullNum] + TRACK_INDENT, HULL_HEIGHT[hullNum] + (TRACK_INDENT << 1), angle, mass);
    }
}