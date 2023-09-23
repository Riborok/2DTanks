import {IEventEmitter} from "../additionally/type";

export interface IKeyHandler extends IEventEmitter {
    clearKeys(): void;
    isKeyDown(keyCode: number): boolean;
}

export class KeyHandler implements IKeyHandler {
    private readonly _keys: Set<number> = new Set();
    private readonly keyDownHandler: (event: KeyboardEvent) => void;
    private readonly keyUpHandler: (event: KeyboardEvent) => void;
    public constructor() {
        this.keyDownHandler = this.handleKeyDown.bind(this);
        this.keyUpHandler = this.handleKeyUp.bind(this);
        document.addEventListener('keydown', this.keyDownHandler);
        document.addEventListener('keyup', this.keyUpHandler);
    }
    public clearKeys() {
        this._keys.clear();
    }
    public isKeyDown(keyCode: number): boolean {
        return this._keys.has(keyCode);
    }
    public removeEventListeners() {
        document.removeEventListener('keydown', this.keyDownHandler);
        document.removeEventListener('keyup', this.keyUpHandler);
    }
    private handleKeyDown(event: KeyboardEvent) {
        this._keys.add(event.keyCode);
    }
    private handleKeyUp(event: KeyboardEvent) {
        this._keys.delete(event.keyCode);
    }
}
