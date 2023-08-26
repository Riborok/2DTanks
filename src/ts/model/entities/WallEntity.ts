import {RectangularEntity} from "./IEntity";

export class WallEntity extends RectangularEntity {
    public constructor(x0: number, y0: number, width: number, height: number, angle: number, mass: number) {
        super(x0, y0, width, height, angle, mass);
    }
}