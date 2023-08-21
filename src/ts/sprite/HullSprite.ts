import {Sprite} from "./Sprite";
import {HULL_HEIGHT, HULL_WIDTH, TRACK_INDENT} from "../constants";
import {Point} from "../model/Point";

export class HullSprite extends Sprite {
    private readonly _num: number;
    public get num(): number { return this._num }
    public constructor(color: number, num: number) {
        super(HULL_WIDTH[num], HULL_HEIGHT[num]);
        this._num = num;
        this._sprite.src = `src/img/tanks/Hulls/Hull_${num}/Hull_${color}.png`;
    }
    public calcPosition(point: Point, angle: number): Point{
        return new Point(
            point.x - TRACK_INDENT * Math.sin(angle),
            point.y + TRACK_INDENT * Math.cos(angle)
        );
    }
}