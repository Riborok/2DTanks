import {IExecutioner} from "./managers/handling managers/HandlingManager";

export interface IGameLoop {
    stop(): void;
    start(): void;
}

export class GameLoop implements IGameLoop {
    private _isGameLoopActive: boolean = false;
    private _lastFrameTime: number = performance.now();
    private readonly _executioners: Iterable<IExecutioner>;
    public constructor(executioners: Iterable<IExecutioner>) {
        this._executioners = executioners;
    }
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
        const deltaTime = currentTime - this._lastFrameTime;

        for (const executioner of this._executioners)
            executioner.handle(deltaTime);

        this._lastFrameTime = currentTime;

        requestAnimationFrame(() => this.gameLoop());
    }
}