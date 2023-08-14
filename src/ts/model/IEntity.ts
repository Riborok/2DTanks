import {Point} from "./Point";

export interface IEntity {
    get points(): Point[];
}
export abstract class RectangularEntity implements IEntity {
    protected readonly _points: Point[];
    protected _angle: number;
    protected constructor(x0: number, y0: number, width: number, height: number, angle: number) {
        this._points = [new Point(x0, y0),
            new Point(x0 + width, y0),
            new Point(x0, y0 + height),
            new Point(x0 + width, y0 + height)];
        this._angle = 0;
        if (angle !== 0)
            this.rotatePoints(-angle);
    }
    get points(): Point[] { return this._points }
    public get angle() : number { return this._angle }
    public calcCenter(): Point {
        return new Point((this.points[0].x + this.points[3].x) >> 1, (this.points[0].y + this.points[3].y) >> 1);
    }

    // Clockwise rotation
    public rotatePoints(deltaAngle: number) {
        this._angle -= deltaAngle;
        const center = this.calcCenter();

        this.points.forEach((point: Point) => {RectangularEntity.rotatePoint(point, center, deltaAngle)});
    }
    public static rotatePoint(point: Point, center: Point, deltaAngle: number) {
        const deltaX = point.x - center.x;
        const deltaY = point.y - center.y;
        const rotatedX = Math.round(deltaX * Math.cos(deltaAngle) - deltaY * Math.sin(deltaAngle));
        const rotatedY = Math.round(deltaX * Math.sin(deltaAngle) + deltaY * Math.cos(deltaAngle));
        point.x = rotatedX + center.x;
        point.y = rotatedY + center.y;
    }
}