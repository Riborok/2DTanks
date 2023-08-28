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
}

export class Vector extends Point{
    public get length(): number { return Math.sqrt(this.x * this.x + this.y * this.y) }
    public normalize() {
        const length = this.length;
        this.x /= length;
        this.y /= length;
    }
    public clone(): Vector { return new Vector(this.x, this.y) }
}

export class Axis extends Vector{
    private constructor(x: number, y: number) { super(x, y) }
    public static create(p1: Point, p2: Point): Axis {
        const axis = new Axis(p1.y - p2.y, p2.x - p1.x);
        axis.normalize();
        return axis;
    }
    public clone(): Axis { return new Axis(this.x, this.y) }
}