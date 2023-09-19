import {Sprite} from "../Sprite";

export class TireTrackSprite extends Sprite implements IVanishing{
    private _opacity: number = 1;
    public constructor(width: number, height: number, type: number) {
        super(width, height, `3`);
        this._sprite.src = `src/img/tanks/Effects/Tire Tracks/Tire_Track_${type}.png`;
    }
    public isVanished(): boolean { return this._opacity <= 0 }
    public reduceOpacity(reduceNumber: number){ this._opacity -= reduceNumber }
    public setOpacity(){ this._sprite.style.opacity = `${this._opacity}` }
}