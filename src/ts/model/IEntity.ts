import {Point, Vector} from "../geometry/Point";
import {TrigCache} from "../additionally/LRUCache";
import {PointRotator} from "../geometry/PointRotator";


/**
 * Interface representing an entity with points.
 */
export interface IEntity {
    /**
     * Gets the points defining the entity. The points should be specified in a clockwise order.
     */
    get points(): Point[];
    get mass(): number;
    get speed(): number;
    get movementVector(): Vector;
    movement(): void;
}

/**
 * An abstract base class representing a rectangular entity.
 * This class implements the IEntity interface and provides methods for manipulating and working with rectangular entities.
 */
export abstract class RectangularEntity implements IEntity {
    protected _points: Point[];
    protected _angle: number;
    protected _mass: number;
    protected _speed: number = 0;
    protected _movementVector: Vector = new Vector(0, 0);
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
    public get speed(): number { return this._speed }
    public get movementVector(): Vector { return this._movementVector }
    public calcCenter(): Point {
        return new Point((this._points[0].x + this._points[2].x) / 2, (this._points[0].y + this._points[2].y) / 2);
    }
    public movement() {
        for (const point of this._points) {
            point.x += this._movementVector.x;
            point.y += this._movementVector.y;
        }
    }
    public rollback() {
        for (const point of this._points) {
            point.x -= this._movementVector.x;
            point.y -= this._movementVector.y;
        }
    }
    public increaseSpeedBy(amount: number){ this._speed += amount }
    public scaleSpeedBy(factor: number) { this._speed *= factor }
    public rotatePoints(deltaAngle: number) {
        this._angle += deltaAngle;
        const center = this.calcCenter();
        const sin = TrigCache.getSin(deltaAngle);
        const cos = TrigCache.getCos(deltaAngle);

        for (const point of this.points)
            PointRotator.rotatePointAroundTarget(point, center, sin, cos);
    }
    public calcMovementVector() {
        this.movementVector.x = this.speed * TrigCache.getCos(this.angle);
        this.movementVector.y = this.speed * TrigCache.getSin(this.angle);
    }
}