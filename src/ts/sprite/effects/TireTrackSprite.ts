import {Sprite} from "../Sprite";

export class TireTrackSprite extends Sprite{
    public constructor(width: number, height: number, type: number) {
        super(width, height, 2);
        this._sprite.src = `src/img/tanks/Effects/Tire Tracks/Tire_Track_${type}.png`;
    }
}