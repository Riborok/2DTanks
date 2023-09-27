import {Point} from "../../../geometry/Point";

export interface IRectangle {
    get point(): Point;
    get width(): number;
    get height(): number;
    get color(): string;
}

export class Rectangle implements IRectangle{
    private readonly _point: Point;
    private readonly _width: number;
    private readonly _height: number;
    private readonly _color: string;
    public get point(): Point { return this._point }
    public get width(): number { return this._width }
    public get height(): number { return this._height }
    public get color(): string { return this._color }
    public constructor(point: Point, width: number, height: number, color: string) {
        this._point = point;
        this._width = width;
        this._height = height;
        this._color = color;
    }
}