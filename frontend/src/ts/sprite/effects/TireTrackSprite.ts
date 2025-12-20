import {IVanish, Sprite} from "../ISprite";

export class TireTrackSprite extends Sprite implements IVanish {
    public constructor(width: number, height: number, type: number) {
        const zIndex: number = 1;
        super(width, height, zIndex);
        this._imgSprite.src = `src/img/tanks/Effects/Tire Tracks/Tire_Track_${type}.png`;
    }
    protected _opacity: number = 1;
    public get opacity(): number { return this._opacity }
    public set opacity(value: number) { this._opacity = value }
}