import {Point, Vector} from "../../geometry/Point";
import {EntityManipulator} from "./EntityManipulator";
import {calcMidBetweenTwoPoint} from "../../geometry/additionalFunc";
import {IPolygon, IPolygonAdjustable} from "../IPolygon";

/**
 * Interface representing an entity with points.
 */
export interface IEntity extends IPolygon, IPolygonAdjustable {
    /**
     * Gets the points defining the entity. The points should be specified in a clockwise order.
     */
    get mass(): number;
    get velocity(): Vector;
    get angularVelocity(): number;
    set angularVelocity(value: number);
    get radiusLength(): number;
    get momentOfInertia(): number;
    get lengthwiseArea(): number;
    get movementLength(): number;
}

const scalingCoeff: number = 3.75;

/**
 * An abstract base class representing a rectangular entity.
 * This class implements the IEntity interface and provides methods for manipulating and working with rectangular entity.
 */
export class RectangularEntity implements IEntity {
    private static readonly scalingCoeff = (1 / 12) * scalingCoeff;

    private _points!: Point[];
    private readonly _mass: number;
    private readonly _id: number;
    private _angularVelocity: number = 0;
    private readonly _velocity: Vector = new Vector(0, 0);

    private readonly _radiusLength: number;
    private readonly _momentOfInertia: number;
    private readonly _width: number;
    private readonly _height: number;
    public constructor(point: Point, width: number, height: number, angle: number, mass: number, id: number) {
        const sumOfSquares = width * width + height * height;
        this._radiusLength = (1 / 2) * Math.sqrt(sumOfSquares);
        this._momentOfInertia = RectangularEntity.scalingCoeff * mass * sumOfSquares;
        this._mass = mass;
        this._id = id;
        this._width = width;
        this._height = height;
        this.adjustPolygon(point, width, height, angle);
    }
    public adjustPolygon(point: Point, width: number, height: number, angle: number) {
        this._points = [point.clone(),
            new Point(point.x + width, point.y),
            new Point(point.x + width, point.y + height),
            new Point(point.x, point.y + height)];
        if (angle !== 0)
            EntityManipulator.rotateEntity(this, angle);
    }
    public get velocity(): Vector { return this._velocity }
    public get angle(): number { return Math.atan2(this._points[1].y - this._points[0].y, this._points[1].x - this._points[0].x) }
    public get points(): Point[] { return this._points }
    public get mass(): number { return this._mass }
    public get angularVelocity(): number { return this._angularVelocity }
    public set angularVelocity(value: number) { this._angularVelocity = value }
    public get id(): number { return this._id }
    public get radiusLength(): number { return this._radiusLength }
    public get momentOfInertia(): number { return this._momentOfInertia }
    public calcCenter(): Point { return calcMidBetweenTwoPoint(this._points[0], this._points[2]) }
    public get lengthwiseArea(): number {
        const deltaAngle = this.angle - this._velocity.angle;
        return this._height * Math.abs(Math.cos(deltaAngle)) + this._width * Math.abs(Math.sin(deltaAngle));
    }
    public get movementLength(): number {
        const deltaAngle = this.angle - this._velocity.angle;
        return this._width * Math.abs(Math.cos(deltaAngle)) + this._height * Math.abs(Math.sin(deltaAngle));
    }
}