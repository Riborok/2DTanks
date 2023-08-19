import {Point} from "./Point";
import {GeomInteractionUtils} from "./GeomInteractionUtils";

export interface IEntity {
    get points(): Point[];
    get id(): number;
}
export abstract class RectangularEntity implements IEntity {
    private static CURRENT_ID : number = 0;

    protected readonly _points: Point[];
    protected _angle: number;
    private readonly _id: number;
    protected constructor(x0: number, y0: number, width: number, height: number, angle: number) {
        this._id = RectangularEntity.CURRENT_ID++;
        this._angle = 0;
        this._points = [new Point(x0, y0),
            new Point(x0 + width, y0),
            new Point(x0, y0 + height),
            new Point(x0 + width, y0 + height)];
        if (angle !== 0)
            this.rotatePoints(angle);
    }
    public get points(): Point[] { return this._points }
    public get id(): number { return this._id }
    public get angle() : number { return this._angle }
    public calcCenter(): Point {
        return new Point((this.points[0].x + this.points[3].x) >> 1, (this.points[0].y + this.points[3].y) >> 1);
    }
    public movePoints(dx: number, dy: number){
        for (const point of this._points) {
            point.x += dx;
            point.y += dy;
        }
    }
    public rotatePoints(deltaAngle: number) {
        this._angle += deltaAngle;
        const center = this.calcCenter();

        for (const point of this.points)
            GeomInteractionUtils.rotatePointAroundTarget(point, center, deltaAngle);
    }
}