import {Point} from "../model/Point";

export abstract class Sprite {
    protected _sprite : HTMLImageElement;
    public get sprite(): HTMLImageElement { return this._sprite }
    protected constructor(width: number, height: number) {
        this._sprite = document.createElement('img');
        this._sprite.style.position = 'absolute';
        this._sprite.style.width = `${width}px`;
        this._sprite.style.height = `${height}px`;
    }
    public setPosition(point: Point) {
        this._sprite.style.left = `${point.x}px`;
        this._sprite.style.top = `${point.y}px`;
    }
    public setAngle(angle: number) {
        this._sprite.style.transform = `rotate(${angle}deg)`;
    }
}