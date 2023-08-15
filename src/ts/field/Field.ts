export class Field {
    private readonly _canvas: Element;
    private readonly _width: number;
    private readonly _height: number;
    public constructor(canvas: Element, width: number, height: number) {
        this._canvas = canvas;
        this._width = width;
        this._height = height;
    }
    public get canvas(): Element { return this._canvas; }
    public get width(): number { return this._width; }
    public get height(): number { return this._height; }
}