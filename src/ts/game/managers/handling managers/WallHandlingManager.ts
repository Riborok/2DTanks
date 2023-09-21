import {HandlingManager} from "./HandlingManager";
import {WallElement} from "../../elements/WallElement";
import {WallMovementManager} from "../movement managers/WallMovementManager";
import {DoublyLinkedList, IDoublyLinkedList} from "../../../additionally/data structures/IDoublyLinkedList";
import {Canvas} from "../../Canvas";
import {ModelIDTracker} from "../../id/ModelIDTracker";

export class WallHandlingManager extends HandlingManager<WallElement, WallMovementManager> {
    private readonly _wallToProcess: IDoublyLinkedList<WallElement> = new DoublyLinkedList<WallElement>();
    public constructor(wallMovementManager: WallMovementManager, canvas: Canvas, elements: Map<number, WallElement>) {
        super(wallMovementManager, canvas, elements, ModelIDTracker.isWall);
    }
    private addToProcess(): void {
        const wallsForProcessing = this._movementManager.collisionManager.wallsForProcessing;
        if (wallsForProcessing.hasForProcessing()) {
            for (const wallID of wallsForProcessing.iterable)
                this._wallToProcess.addToTail(this._elements.get(wallID));
            wallsForProcessing.clear();
        }
    }
    public handle(deltaTime: number): void {
        this.addToProcess();
        if (!this._wallToProcess.isEmpty()) {
            this._wallToProcess.applyAndRemove(this._movementManager.movement.bind(this._movementManager),
                this._movementManager.isCompleteMotion.bind(this._movementManager), deltaTime);
        }
    }
}