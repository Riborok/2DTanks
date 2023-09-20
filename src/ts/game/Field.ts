export class Field {
    private readonly _canvas: Element;
    public constructor(canvas: Element) { this._canvas = canvas }
    public get canvas(): Element { return this._canvas }
}