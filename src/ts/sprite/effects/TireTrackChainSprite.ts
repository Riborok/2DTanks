import {Sprite} from "../Sprite";

export class TireTrackChainSprite extends Sprite{
    private _opacity: number = 1;
    private static readonly REDUCING_OPACITY_NUMBER: number = 0.01;
    public get opacity() { return this._opacity }
    public constructor(width: number, height: number, type: number) {
        super(width, height);
        this._sprite.src = `src/img/tanks/Effects/Tire Tracks/Tire_Track_Chain_${type}.png`;
        this._sprite.style.zIndex = `2`;
    }
    public isVanished(): boolean{ return this._opacity <= 0 }
    public reduceOpacity(){ this._opacity -= TireTrackChainSprite.REDUCING_OPACITY_NUMBER }
    public setOpacity(){ this._sprite.style.opacity = `${this._opacity}` }
}