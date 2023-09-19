import {IRender, Render} from "./IRender";

export interface IGameLoop {
    stop(): void;
    start(): void;
    get render(): IRender;
}

export class GameLoop implements IGameLoop {
    private _isGameLoopActive: boolean = false;
    private _lastFrameTime: number = performance.now();
    private readonly _render: IRender = new Render();
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

        this._lastFrameTime = currentTime;

        requestAnimationFrame(() => this.gameLoop());
    }
}