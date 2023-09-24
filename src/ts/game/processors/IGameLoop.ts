import {IRender, Render} from "./IRender";
import {IDrawable} from "./ICanvas";

export interface IGameLoop {
    stop(): void;
    start(): void;
    get render(): IRender;
}

export class GameLoop implements IGameLoop {
    private _isGameLoopActive: boolean = false;
    private _lastFrameTime: number = performance.now();
    private readonly _render: IRender = new Render();
    private readonly _drawable: IDrawable;
    public constructor(drawable: IDrawable) { this._drawable = drawable }
    public get render(): IRender { return this._render }
    public start() {
        if (!this._isGameLoopActive) {
            this._isGameLoopActive = true;
            requestAnimationFrame(() => this.gameLoop());
        }
    }
    public stop() {
        this._isGameLoopActive = false;
    }
    private gameLoop() {
        if (!this._isGameLoopActive)
            return;

        const currentTime = performance.now();

        this._render.renderAll(currentTime - this._lastFrameTime);
        this._drawable.drawAll();

        this._lastFrameTime = currentTime;

        requestAnimationFrame(() => this.gameLoop());
    }
}