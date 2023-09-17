export interface IKeyHandler {
    clearKeys(): void;
    isKeyDown(keyCode: number): boolean;
}

export class KeyHandler implements IKeyHandler {
    private readonly _keys: Set<number> = new Set();
    public constructor() {
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
    }
    public clearKeys() {
        this._keys.clear();
    }
    public isKeyDown(keyCode: number): boolean {
        return this._keys.has(keyCode);
    }
    private handleKeyDown(event: KeyboardEvent) {
        this._keys.add(event.keyCode);
    }
    private handleKeyUp(event: KeyboardEvent) {
        this._keys.delete(event.keyCode);
    }
}