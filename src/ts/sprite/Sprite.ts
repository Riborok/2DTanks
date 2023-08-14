export abstract class Sprite {
    protected _sprite : any;
    public get sprite(): any { return this._sprite }
    protected constructor(width: number, height: number) {
        this._sprite = document.createElement('img');
        this._sprite.style.position = 'absolute';
        this._sprite.style.width = `${width}px`;
        this._sprite.style.height = `${height}px`;
    }
    public setPosition(x: number, y: number, angle: number) {
        this._sprite.style.left = `${x}px`;
        this._sprite.style.top = `${y}px`;
    }
    public setAngle(x: number, y: number, angle: number) {
        this._sprite.style.transform = `rotate(${angle}deg)`;
    }
}