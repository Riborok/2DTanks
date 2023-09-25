import {IFrameByFrame, Sprite} from "../ISprite";
import {ResolutionManager} from "../../constants/gameConstants";

export class SpriteAcceleration extends Sprite implements IFrameByFrame {
    private static readonly ORIGINAL_SIZE: number = 256;

    private _frame: number = 0;
    public constructor() {
        const zIndex: number = 2;
        super(ResolutionManager.ACCELERATION_SIZE, ResolutionManager.ACCELERATION_SIZE, zIndex);
        this._sprite.src = 'src/img/tanks/Effects/Movement/Movement.png';
    }
    public set frame(value: number) {
        this._frame = value;
    }
    public get frame(): number {
        return this._frame;
    }
    public get originalWidth(): number { return SpriteAcceleration.ORIGINAL_SIZE }
    public get originalHeight(): number { return SpriteAcceleration.ORIGINAL_SIZE }
}