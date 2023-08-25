import {Point} from "./Point";
import {GeomInteractionUtils} from "./GeomInteractionUtils";
import {TrigCache} from "../additionally/LRUCache";

/**
 * Interface representing an entity with points.
 */
export interface IEntity {
    /**
     * Gets the points defining the entity. The points should be specified in a clockwise order.
     */
    get points(): Point[];
    get mass(): number;
}

/**
 * An abstract base class representing a rectangular entity.
 * This class implements the IEntity interface and provides methods for manipulating and working with rectangular entities.
 */
export abstract class RectangularEntity implements IEntity {
    protected _points: Point[];
    protected _angle: number;
    protected _mass: number;
    protected constructor(x0: number, y0: number, width: number, height: number, angle: number, mass: number) {
        this._angle = 0;
        this._mass = mass;
        this._points = [new Point(x0, y0),
            new Point(x0 + width, y0),
            new Point(x0 + width, y0 + height),
            new Point(x0, y0 + height)];
        if (angle !== 0)
            this.rotatePoints(angle);
    }
    public get points(): Point[] { return this._points }
    public get angle(): number { return this._angle }
    public get mass(): number { return this._mass }
    public calcCenter(): Point {
        return new Point((this._points[0].x + this._points[2].x) >> 1, (this._points[0].y + this._points[2].y) >> 1);
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
            GeomInteractionUtils.rotatePointAroundTarget(point, center, TrigCache.getSin(deltaAngle), TrigCache.getCos(deltaAngle));
    }
}