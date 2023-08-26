import {Point} from "../geometry/Point";

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
    /**
     * Calculates the initial position of the tank sprite part based on a reference point,
     * while taking into account the rotation angle represented by sine and cosine values.
     * @param point The reference point around which the part's position is calculated.
     * @param sin The sine value of the rotation angle.
     * @param cos The cosine value of the rotation angle.
     * @returns The calculated initial position of the tank sprite part.
     */
    public abstract calcPosition(point: Point, sin: number, cos: number): Point;
}