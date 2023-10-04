import {IEventEmitter} from "../../additionally/type";

export interface IKeyHandler extends IEventEmitter {
    clearKeys(): void;
    isKeyDown(keyCode: number): boolean;
}

export class KeyHandler implements IKeyHandler {
    private readonly _keys: Set<number> = new Set();
    public addEventListeners(): void {
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
    }
    public clearKeys() {
        this._keys.clear();
    }
    public isKeyDown(keyCode: number): boolean {
        return this._keys.has(keyCode);
    }
    public removeEventListeners() {
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
    }
    private handleKeyDown = (event: KeyboardEvent) => {
        this._keys.add(event.keyCode);
    }
    private handleKeyUp = (event: KeyboardEvent) => {
        this._keys.delete(event.keyCode);
    }
}
