import {VK_A, VK_D, VK_DOWN, VK_LEFT, VK_RIGHT, VK_S, VK_UP, VK_W} from "../constants";
import {IMovementManager} from "./IMovementManager";
import {TankElement} from "./TankElement";

export class KeyHandler {
    private static readonly W_MASK: number = 1 << 0;
    private static readonly S_MASK: number = 1 << 1;
    private static readonly D_MASK: number = 1 << 2;
    private static readonly A_MASK: number = 1 << 3;

    private static readonly UP_MASK: number = 1 << 4;
    private static readonly DOWN_MASK: number = 1 << 5;
    private static readonly RIGHT_MASK: number = 1 << 6;
    private static readonly LEFT_MASK: number = 1 << 7;


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
        if (this._tankElements.length >= 1 && this._tankElements[0] !== null) {
            if (this._keysMask & KeyHandler.W_MASK)
                this._movementManager.moveForward(this._tankElements[0]);

            if (this._keysMask & KeyHandler.S_MASK)
                this._movementManager.moveBackward(this._tankElements[0]);

            if (this._keysMask & KeyHandler.D_MASK)
                this._movementManager.hullClockwiseMovement(this._tankElements[0]);

            if (this._keysMask & KeyHandler.A_MASK)
                this._movementManager.hullCounterclockwiseMovement(this._tankElements[0]);
        }
        if (this._tankElements.length >= 2 && this._tankElements[1] !== null) {
            if (this._keysMask & KeyHandler.UP_MASK)
                this._movementManager.moveForward(this._tankElements[1]);

            if (this._keysMask & KeyHandler.DOWN_MASK)
                this._movementManager.moveBackward(this._tankElements[1]);

            if (this._keysMask & KeyHandler.RIGHT_MASK)
                this._movementManager.hullClockwiseMovement(this._tankElements[1]);

            if (this._keysMask & KeyHandler.LEFT_MASK)
                this._movementManager.hullCounterclockwiseMovement(this._tankElements[1]);
        }
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
            case VK_UP:
                return KeyHandler.UP_MASK;
            case VK_DOWN:
                return KeyHandler.DOWN_MASK;
            case VK_LEFT:
                return KeyHandler.LEFT_MASK;
            case VK_RIGHT:
                return KeyHandler.RIGHT_MASK;
            default:
                return 0;
        }
    }
}