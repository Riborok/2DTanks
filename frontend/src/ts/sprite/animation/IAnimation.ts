import {IIdentifiable} from "../../game/id/IIdentifiable";
import {IGetImgSprite, Sprite} from "../ISprite";

export interface IAnimation extends IIdentifiable, IGetImgSprite {
    get isEnded(): boolean;
    changeFrame(deltaTime: number): void;
}

export abstract class AnimationSprite extends Sprite implements IAnimation {
    protected abstract get UPDATE_TIMER_TIME(): number;
    protected abstract get MAX_FRAME(): number;
    protected _frame: number = 0;
    private _isEnded: boolean = false;
    private _timer: number = 0;
    public seekToElapsedMs(elapsedMs: number): void {
        const elapsed = Math.max(0, elapsedMs);
        const completedFrames = Math.floor(elapsed / this.UPDATE_TIMER_TIME);
        this._frame = Math.min(completedFrames, this.MAX_FRAME);
        this._timer = elapsed % this.UPDATE_TIMER_TIME;
        this._isEnded = completedFrames > this.MAX_FRAME;
    }
    public changeFrame(deltaTime: number): void {
        this._timer += deltaTime;
        if (this._timer >= this.UPDATE_TIMER_TIME){
            this._timer -= this.UPDATE_TIMER_TIME;

            this._frame++;
            if (this._frame > this.MAX_FRAME) {
                this._frame = this.MAX_FRAME;
                this._isEnded = true;
            }
        }
    }
    public get isEnded(): boolean {
        return this._isEnded;
    }
}
