/**
 * A class representing a point in a 2D space.
 */
export class Point {
    protected _x: number;
    protected _y: number;
    public constructor(x: number, y: number) {
        this._x = x;
        this._y = y;
    }
    public get x(): number { return this._x }
    public set x(value: number) { this._x = value }
    public get y(): number { return this._y }
    public set y(value: number) { this._y = value }
    public clone() : Point { return new Point(this._x, this._y) }
    /**
     * Adds the specified values to the point's coordinates.
     * @param dx The value to add to the x-coordinate.
     * @param dy The value to add to the y-coordinate.
     */
    public addToCoordinates(dx: number, dy: number) {
        this._x += dx;
        this._y += dy;
    }
}

/**
 * A class representing a 2D vector.
 */
export class Vector extends Point{
    /**
     * Gets the length (magnitude) of the vector.
     */
    public get length(): number { return Math.sqrt(this.x * this.x + this.y * this.y) }
    /**
     * Normalizes the vector.
     */
    public normalize() {
        const length = this.length;
        this._x /= length;
        this._y /= length;
    }
    public get angle(): number { return Math.atan2(this.y, this.x) }
    public clone(): Vector { return new Vector(this.x, this.y) }
    /**
     * Adds another vector to this vector.
     * @param vector The vector to add to this vector.
     */
    public addVector(vector: Vector) {
        this._x += vector._x;
        this._y += vector._y;
    }
    /**
     * Scales (multiplies) the vector by a scalar value.
     * @param scalar The scalar value to multiply the vector by.
     */
    public scale(scalar: number) {
        this._x *= scalar;
        this._y *= scalar;
    }
}

/**
 * A class representing a 2D axis.
 */
export class Axis extends Vector{
    private constructor(x: number, y: number) { super(x, y) }
    /**
     * Creates an Axis instance representing an axis perpendicular to the line defined by two points.
     * @param p1 The first point on the line.
     * @param p2 The second point on the line.
     * @returns A new Axis instance representing the perpendicular axis.
     */
    public static create(p1: Point, p2: Point): Axis {
        const axis = new Axis(p1.y - p2.y, p2.x - p1.x);
        axis.normalize();
        return axis;
    }
    public clone(): Axis { return new Axis(this._x, this._y) }
}