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
    public addToCoordinates(dx: number, dy: number) {
        this._x += dx;
        this._y += dy;
    }
}

export class Vector extends Point{
    public get length(): number { return Math.sqrt(this.x * this.x + this.y * this.y) }
    public normalize() {
        const length = this.length;
        this._x /= length;
        this._y /= length;
    }
    public get angle(): number { return Math.atan2(this.y, this.x) }
    public clone(): Vector { return new Vector(this.x, this.y) }
    public addVector(vector: Vector) {
        this._x += vector._x;
        this._y += vector._y;
    }
    public scale(scalar: number) {
        this._x *= scalar;
        this._y *= scalar;
    }
}

export class Axis extends Vector{
    private constructor(x: number, y: number) { super(x, y) }
    public static create(p1: Point, p2: Point): Axis {
        const axis = new Axis(p1.y - p2.y, p2.x - p1.x);
        axis.normalize();
        return axis;
    }
    public clone(): Axis { return new Axis(this._x, this._y) }
}