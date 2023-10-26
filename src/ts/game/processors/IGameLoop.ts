import {IRender, Render} from "./IRender";
import {IDrawable} from "./ICanvas";

export interface IGameLoop {
    stop(): void;
    start(): void;
    get render(): IRender;
}

export class GameLoop implements IGameLoop {
    private _lastFrameTime: number;
    private _lastCallID: number = 0;

    private readonly _render: IRender = new Render();
    private readonly _drawable: IDrawable;
    public constructor(drawable: IDrawable) { this._drawable = drawable }
    public get render(): IRender { return this._render }
    public start() {
        if (this._lastCallID === 0) {
            this._lastFrameTime = performance.now();
            this._lastCallID = requestAnimationFrame(this.gameLoop);
        }
    }
    public stop() {
        cancelAnimationFrame(this._lastCallID);
        this._lastCallID = 0;
    }
    private readonly gameLoop = (highResTimeStamp: DOMHighResTimeStamp) => {
        const time = highResTimeStamp.valueOf();

        this._render.renderAll(time - this._lastFrameTime);
        this._drawable.drawAll();
        this._lastFrameTime = time;

        this._lastCallID = requestAnimationFrame(this.gameLoop);
    }
}