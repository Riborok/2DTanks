import {IVanish, Sprite} from "../Sprite";

export class TireTrackChainSprite extends Sprite implements IVanish {
    public constructor(width: number, height: number, type: number) {
        super(width, height, 2);
        this._sprite.src = `src/img/tanks/Effects/Tire Tracks/Tire_Track_Chain_${type}.png`;
    }
    protected _opacity: number = 1;
    public get opacity(): number { return this._opacity }
    public set opacity(value: number) { this._opacity = value }
}