import {IPolygon, IPolygonAdjustable} from "../../polygon/IPolygon";
import {Bonus} from "../../constants/gameConstants";
import {Point} from "../../geometry/Point";
import {calcMidBetweenTwoPoint} from "../../geometry/additionalFunc";
import {PolygonManipulator} from "../../polygon/PolygonManipulator";

export interface ICollectible extends IPolygon, IPolygonAdjustable {
    get bonus(): Bonus;
}

export class RectangularBonus implements ICollectible {
    private readonly _id: number;
    private readonly _bonus: Bonus;
    private _points: Point[];
    public constructor(point: Point, width: number, height: number, angle: number, id: number, bonus: Bonus) {
        this._id = id;
        this._bonus = bonus;
        this.adjustPolygon(point, width, height, angle);
    }
    public get bonus(): Bonus { return this._bonus }
    public get id(): number { return this._id }
    public get points(): Point[] { return this._points }
    public calcCenter(): Point { return calcMidBetweenTwoPoint(this._points[0], this._points[2]) }
    public adjustPolygon(point: Point, width: number, height: number, angle: number) {
        this._points = [point.clone(),
            new Point(point.x + width, point.y),
            new Point(point.x + width, point.y + height),
            new Point(point.x, point.y + height)];
        if (angle !== 0)
            PolygonManipulator.rotatePolygon(this, angle);
    }
    public get angle(): number { return Math.atan2(this._points[1].y - this._points[0].y, this._points[1].x - this._points[0].x) }
}