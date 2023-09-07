import {HandlingManagers, IWallHandlingManagers} from "./HandlingManagers";
import {WallElement} from "../../elements/WallElement";
import {WallMovementManager} from "../movement managers/WallMovementManager";
import {DoubleLinkedList, IDoubleLinkedList} from "../../../additionally/data structures/IDoubleLinkedList";

export class WallHandlingManagers extends HandlingManagers<WallElement, WallMovementManager> implements IWallHandlingManagers {
    private _wallToProcess: IDoubleLinkedList<WallElement> = new DoubleLinkedList<WallElement>;
    private addToProcess(): void {
        const collisionManager = this._movementManager.collisionManager;
        if (collisionManager.hasWallsForProcessing())
            for (const wallID of collisionManager.getWallsForProcessing())
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