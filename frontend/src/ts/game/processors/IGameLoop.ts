import {IRender, Render} from "./IRender";
import {IDrawable} from "./ICanvas";

export interface IGameLoop {
    stop(): void;
    start(): void;
    pause(): void;
    resume(): void;
    get render(): IRender;
}

export class GameLoop implements IGameLoop {
    private _isRunning: boolean = false;
    private _isActivate: boolean = false;
    private _lastFrameTime: number = 0;

    private readonly _render: IRender = new Render();
    private readonly _drawable: IDrawable;
    public constructor(drawable: IDrawable) { this._drawable = drawable }
    public get render(): IRender { return this._render }
    public start() {
        if (!this._isRunning) {
            this._isRunning = true;
            this.resume();
            requestAnimationFrame(this.gameLoop);
        }
    }
    public stop() {
        this._isRunning = false;
    }
    public pause() {
        this._isActivate = false;
    }
    public resume() {
        this._isActivate = true;
        this._lastFrameTime = performance.now();
    }
    private readonly gameLoop = (highResTimeStamp: DOMHighResTimeStamp) => {
        if (this._isRunning) {
            if (this._isActivate) {
                const currentTime = highResTimeStamp.valueOf();
                this._render.renderAll(currentTime - this._lastFrameTime);
                this._drawable.drawAll();
                this._lastFrameTime = currentTime;
            }

            requestAnimationFrame(this.gameLoop);
        }
    }
}