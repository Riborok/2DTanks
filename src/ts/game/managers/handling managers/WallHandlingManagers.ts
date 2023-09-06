import {HandlingManagers, IWallHandlingManagers} from "./HandlingManagers";
import {WallElement} from "../../elements/WallElement";
import {WallMovementManager} from "../movement managers/WallMovementManager";
import {DoubleLinkedList} from "../../../additionally/DoubleLinkedList";

export class WallHandlingManagers extends HandlingManagers<WallElement, WallMovementManager> implements IWallHandlingManagers {
    private _wallToProcess: DoubleLinkedList<WallElement> = new DoubleLinkedList<WallElement>;
    private addToProcess(): void {
        const wallsForProcessing = this._movementManager.collisionManager.wallsForProcessing;
        for (const wallID of wallsForProcessing)
            this._wallToProcess.addToTail(this._elements.get(wallID));
    }
    public handle(): void {
        this.addToProcess();
        let currNode = this._wallToProcess.head;
        while (currNode !== null) {
            if (this._movementManager.hasAnyResidualMovement(currNode.value))
                currNode = currNode.next;
            else {
                const prevNode = currNode;
                currNode = currNode.next;
                this._wallToProcess.removeNode(prevNode);
            }
        }
    }
}