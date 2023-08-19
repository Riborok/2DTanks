import {VK_A, VK_D, VK_S, VK_W} from "../constants";
import {IMovementManager} from "./IMovementManager";
import {TankElement} from "./TankElement";

export class KeyHandler {
    private static readonly W_MASK: number = 0b0000_0001;
    private static readonly S_MASK: number = 0b0000_0010;
    private static readonly D_MASK: number = 0b0000_0100;
    private static readonly A_MASK: number = 0b0000_1000;

    private _keysMask: number = 0;
    private readonly _tankElements: TankElement[] = [];
    private readonly _movementManager: IMovementManager;
    public constructor(movementManager: IMovementManager) {
        this._movementManager = movementManager;
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
    }
    public clearMask() { this._keysMask = 0 }
    public addTankElement(tankElement: TankElement) {
        this._tankElements.push(tankElement);
    }
    public handleKeys() {
        if (this._keysMask & KeyHandler.W_MASK)
            this._movementManager.moveForward(this._tankElements[0]);

        if (this._keysMask & KeyHandler.S_MASK)
            this._movementManager.moveBackward(this._tankElements[0]);

        if (this._keysMask & KeyHandler.D_MASK)
            this._movementManager.hullClockwiseMovement(this._tankElements[0]);

        if (this._keysMask & KeyHandler.A_MASK)
            this._movementManager.hullCounterclockwiseMovement(this._tankElements[0]);
    }
    private handleKeyDown(event: KeyboardEvent) {
        this._keysMask |= KeyHandler.getMask(event.keyCode);
    }
    private handleKeyUp(event: KeyboardEvent) {
        this._keysMask &= ~KeyHandler.getMask(event.keyCode);
    }
    private static getMask(keyCode: number): number {
        switch (keyCode) {
            case VK_W:
                return KeyHandler.W_MASK;
            case VK_S:
                return KeyHandler.S_MASK;
            case VK_A:
                return KeyHandler.A_MASK;
            case VK_D:
                return KeyHandler.D_MASK;
            default:
                return 0;
        }
    }
}