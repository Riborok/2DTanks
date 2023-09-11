import {HandlingManagers, IWallHandlingManager} from "./HandlingManagers";
import {WallElement} from "../../elements/WallElement";
import {WallMovementManager} from "../movement managers/WallMovementManager";
import {DoublyLinkedList, IDoublyLinkedList} from "../../../additionally/data structures/IDoublyLinkedList";

export class WallHandlingManager extends HandlingManagers<WallElement, WallMovementManager> implements IWallHandlingManager {
    private _wallToProcess: IDoublyLinkedList<WallElement> = new DoublyLinkedList<WallElement>();
    private addToProcess(): void {
        const wallsForProcessing = this._movementManager.collisionManager.wallsForProcessing;
        if (wallsForProcessing.hasForProcessing()) {
            for (const wallID of wallsForProcessing.iterable)
                this._wallToProcess.addToTail(this._elements.get(wallID));
            wallsForProcessing.clear();
        }
    }
    public handle(): void {
        this.addToProcess();
        if (!this._wallToProcess.isEmpty())
            this._wallToProcess.applyAndRemove(this._movementManager.movement.bind(this._movementManager),
                this._movementManager.hasAnyResidualMovement.bind(this._movementManager));
    }
}