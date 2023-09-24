import {IScalable, Sprite} from "../ISprite";

class KeySprite extends Sprite implements IScalable{
    private static readonly CHANGE_SCALE_X_NUMBER: number = 0.01;
    private _scaleX: number = 1;
    private _isIncreasing: boolean = false;
    public constructor(width: number, height: number) {
        super(width, height, 1);
        this._sprite.src = "src/img/item/Key.png";
    }
    get scaleX(): number {
        if (this._isIncreasing){
            this._scaleX += KeySprite.CHANGE_SCALE_X_NUMBER;

            if (this._scaleX >= 1)
                this._isIncreasing = false;
        } else {
            this._scaleX -= KeySprite.CHANGE_SCALE_X_NUMBER;

            if (this._scaleX <= -1)
                this._isIncreasing = true;
        }

        return this._scaleX;
    }
    get scaleY(): number { return 1 }
}