import {Point} from "../../geometry/Point";
import {EntityManipulator} from "./EntityManipulator";
import {IIdentifiable} from "../../game/id/IIdentifiable";


/**
 * Interface representing an entity with points.
 */
export interface IEntity extends IIdentifiable{
    /**
     * Gets the points defining the entity. The points should be specified in a clockwise order.
     */
    get points(): Point[];
    get mass(): number;
    get speed(): number;
    get directionAngle(): number;
    set speed(value: number);
    set directionAngle(value: number);
    calcCenter(): Point;
}

/**
 * An abstract base class representing a rectangular entity.
 * This class implements the IEntity interface and provides methods for manipulating and working with rectangular entitiy.
 */
export class RectangularEntity implements IEntity {
    protected _points: Point[];
    protected readonly _mass: number;
    protected readonly _id: number;
    protected _speed: number = 0;
    protected _angle: number = 0;
    public constructor(x0: number, y0: number, width: number, height: number, angle: number, mass: number, id: number) {
        this._mass = mass;
        this._id = id;
        this._points = [new Point(x0, y0),
            new Point(x0 + width, y0),
            new Point(x0 + width, y0 + height),
            new Point(x0, y0 + height)];
        if (angle !== 0)
            EntityManipulator.rotatePointAroundTarget(this, angle, this.calcCenter());
    }
    public get points(): Point[] { return this._points }
    public get directionAngle(): number { return this._angle }
    public get mass(): number { return this._mass }
    public get speed(): number { return this._speed }
    public get id(): number { return this._id }
    public set speed(value: number) { this._speed = value }
    public set directionAngle(value: number) { this._angle = value }
    public calcCenter(): Point {
        return new Point((this._points[0].x + this._points[2].x) / 2, (this._points[0].y + this._points[2].y) / 2);
    }
}