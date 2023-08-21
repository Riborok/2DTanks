import {Point} from "../model/Point";

export abstract class Sprite {
    protected _sprite : HTMLImageElement;
    public get sprite(): HTMLImageElement { return this._sprite }
    protected constructor(width: number, height: number) {
        this._sprite = new Image(width, height);
        this._sprite.classList.add('sprite');
    }
    public setPosition(point: Point) {
        this._sprite.style.left = `${point.x}px`;
        this._sprite.style.top = `${point.y}px`;
    }
    public setAngle(angle: number) {
        this._sprite.style.transform = `rotate(${angle}rad)`;
    }
}

export abstract class TankSpritePart extends Sprite {
    private readonly _width: number;
    private readonly _height: number;
    public get width(): number { return this._width }
    public get height(): number { return this._height }
    protected constructor(width: number, height: number) {
        super(width,height);
        this._width = width;
        this._height = height;
    }
    public abstract calcPosition(point: Point, angle: number): Point;
}