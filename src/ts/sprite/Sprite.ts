import {Point} from "../geometry/Point";

export abstract class Sprite {
    protected _sprite : HTMLImageElement;
    public get width(): number { return this._sprite.width }
    public get height(): number { return this._sprite.height }
    public get sprite(): HTMLImageElement { return this._sprite }
    protected constructor(width: number, height: number, zIndex: string) {
        this._sprite = new Image(width, height);
        this._sprite.classList.add('sprite');
        this._sprite.style.zIndex = zIndex;
    }
    public setPosition(point: Point) {
        this._sprite.style.left = `${point.x}px`;
        this._sprite.style.top = `${point.y}px`;
    }
    public setAngle(angle: number) {
        this._sprite.style.transform = `rotate(${angle}rad)`;
    }
    public setAngleWithScaling(angle: number, scaleX: number, scaleY: number) {
        this._sprite.style.transform = `rotate(${angle}rad) scaleX(${scaleX}) scaleY(${scaleY})`;
    }
    public remove(){
        this._sprite.remove();
    }
}

export interface ISpritePart {
    /**
     * Calculates the initial position of the sprite part based on a reference point,
     * while taking into account the rotation angle represented by sine and cosine values.
     * @param point The reference point around which the part's position is calculated.
     * @param sin The sine value of the rotation angle.
     * @param cos The cosine value of the rotation angle.
     * @returns The calculated initial position of the sprite part.
     */
    calcPosition(point: Point, sin: number, cos: number): Point;
}