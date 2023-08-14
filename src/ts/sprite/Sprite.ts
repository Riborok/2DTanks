abstract class Sprite {
    protected _sprite : any;
    public get sprite(): any { return this._sprite }
    protected constructor() {
        this._sprite = document.createElement('img');
        this._sprite.style.position = 'absolute';
    }
    public setPosition(x: number, y: number) {
        this._sprite.style.left = `${x}px`;
        this._sprite.style.top = `${y}px`;
    }
    public setAngle(angle: number) {
        this._sprite.style.transform = `rotate(${angle}deg)`;
    }
}