import {HandlingManager} from "./HandlingManager";
import {WallElement} from "../../elements/WallElement";
import {WallMovementManager} from "../movement managers/WallMovementManager";
import {DoublyLinkedList, IDoublyLinkedList} from "../../../additionally/data structures/IDoublyLinkedList";
import {ModelIDTracker} from "../../id/ModelIDTracker";
import {IStorage} from "../../../additionally/type";
import {ISprite} from "../../../sprite/Sprite";

export class WallHandlingManager extends HandlingManager<WallElement, WallMovementManager> {
    private readonly _wallToProcess: IDoublyLinkedList<WallElement> = new DoublyLinkedList<WallElement>();
    public constructor(wallMovementManager: WallMovementManager, storage: IStorage<ISprite>, elements: Map<number, WallElement>) {
        super(wallMovementManager, storage, elements, ModelIDTracker.isWall);
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