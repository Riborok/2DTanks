import {Point} from "../../geometry/Point";
import {EntityManipulator} from "./EntityManipulator";
import {IIdentifiable} from "../../game/id/IIdentifiable";
import {calcDistance} from "../../geometry/additionalFunc";


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
    get angularVelocity(): number;
    get directionAngle(): number;
    set speed(value: number);
    set directionAngle(value: number);
    set angularVelocity(value: number);
    calcCenter(): Point;
    get radiusLength(): number;
}

/**
 * An abstract base class representing a rectangular entity.
 * This class implements the IEntity interface and provides methods for manipulating and working with rectangular entitiy.
 */
export class RectangularEntity implements IEntity {
    private readonly _points: Point[];
    private readonly _mass: number;
    private readonly _id: number;
    private _angularVelocity: number = 0;
    private _speed: number = 0;
    private _angle: number = 0;
    private readonly _radiusLength: number;
    public constructor(point: Point, width: number, height: number, angle: number, mass: number, id: number) {
        this._mass = mass;
        this._id = id;
        this._points = [point.clone(),
            new Point(point.x + width, point.y),
            new Point(point.x + width, point.y + height),
            new Point(point.x, point.y + height)];
        if (angle !== 0)
            EntityManipulator.rotateEntity(this, angle);
        this._radiusLength = calcDistance(this.calcCenter(), this._points[0]);
    }
    public get points(): Point[] { return this._points }
    public get directionAngle(): number { return this._angle }
    public get mass(): number { return this._mass }
    public get angularVelocity(): number { return this._angularVelocity }
    public get speed(): number { return this._speed }
    public get id(): number { return this._id }
    public set speed(value: number) { this._speed = value }
    public get radiusLength(): number { return this._radiusLength }
    public set directionAngle(value: number) { this._angle = value }
    public set angularVelocity(value: number) { this._angularVelocity = value }
    public calcCenter(): Point {
        return new Point((this._points[0].x + this._points[2].x) / 2, (this._points[0].y + this._points[2].y) / 2);
    }
}