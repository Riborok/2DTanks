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
    private readonly _endGameConditions: () => boolean;
    private readonly _processPostGameActions: () => void;
    public constructor(drawable: IDrawable, endGameConditions: () => boolean = () => false,
                       processPostGameActions: () => void = () => {}) {
        this._drawable = drawable;
        this._endGameConditions = endGameConditions;
        this._processPostGameActions = processPostGameActions;
    }
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
        if (!this._isGameLoopActive || this._endGameConditions()) {
            this._processPostGameActions();
            return;
        }

        const currentTime = performance.now();

        this._render.renderAll(currentTime - this._lastFrameTime);
        this._drawable.drawAll();

        this._lastFrameTime = currentTime;

        requestAnimationFrame(() => this.gameLoop());
    }
}