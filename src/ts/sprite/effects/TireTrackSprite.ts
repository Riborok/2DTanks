import {IVanish, Sprite} from "../ISprite";

export class TireTrackSprite extends Sprite implements IVanish {
    public constructor(width: number, height: number, type: number) {
        super(width, height, 2);
        this._sprite.src = `src/img/tanks/Effects/Tire Tracks/Tire_Track_${type}.png`;
    }
    protected _opacity: number = 1;
    public get opacity(): number { return this._opacity }
    public set opacity(value: number) { this._opacity = value }
}