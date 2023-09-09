import {HandlingManagers, IWallHandlingManagers} from "./HandlingManagers";
import {WallElement} from "../../elements/WallElement";
import {WallMovementManager} from "../movement managers/WallMovementManager";
import {DoubleLinkedList, IDoubleLinkedList} from "../../../additionally/data structures/IDoubleLinkedList";

export class WallHandlingManagers extends HandlingManagers<WallElement, WallMovementManager> implements IWallHandlingManagers {
    private _wallToProcess: IDoubleLinkedList<WallElement> = new DoubleLinkedList<WallElement>();
    private addToProcess(): void {
        const wallsForProcessing = this._movementManager.collisionManager.wallsForProcessing;
        if (wallsForProcessing.hasWallsForProcessing()) {
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