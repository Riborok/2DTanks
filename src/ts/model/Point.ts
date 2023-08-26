export class Point {
    private _x: number;
    private _y: number;
    public constructor(x: number, y: number) {
        this._x = x;
        this._y = y;
    }
    public get x(): number { return this._x }
    public set x(value: number) { this._x = value }
    public get y(): number { return this._y }
    public set y(value: number) { this._y = value }
    public clone() : Point { return new Point(this._x, this._y) }
    public static dot(point1: Point, point2: Point): number { return point1.x * point2.x + point1.y * point2.y }
}

export class Vector extends Point{
    public get length(): number { return Math.sqrt(this.x * this.x + this.y * this.y) }
    public normalize() {
        const length = this.length;
        this.x /= length;
        this.y /= length;
    }
    public scale(scalar: number) {
        this.x *= scalar;
        this.y *= scalar;
    }
    public add(vector: Vector) {
        this.x += vector.x;
        this.y += vector.y;
    }
    public subtract(vector: Vector) {
        this.x -= vector.x;
        this.y -= vector.y;
    }
}

export class Axis extends Vector{
    public constructor(p1: Point, p2: Point) {
        super(p1.y - p2.y, p2.x - p1.x);
        this.normalize();
    }
}