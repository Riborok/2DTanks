import {HandlingManagers, IBulletHandlingManager} from "./HandlingManagers";
import {BulletElement} from "../../elements/BulletElement";
import {BulletManager} from "../movement managers/BulletManager";
import {DoublyLinkedList, IDoublyLinkedList} from "../../../additionally/data structures/IDoublyLinkedList";

export class BulletHandlingManager extends HandlingManagers<BulletElement, BulletManager> implements IBulletHandlingManager {
    private _bulletToProcess: IDoublyLinkedList<BulletElement> = new DoublyLinkedList<BulletElement>();
    public handle(): void {
        if (!this._bulletToProcess.isEmpty())
            this._bulletToProcess.applyAndRemove(this._movementManager.movement.bind(this._movementManager),
                this._movementManager.hasResidualMovement.bind(this._movementManager));
    }

    public addElement(bulletElements: BulletElement) {
        if (!this._elements.has(bulletElements.id)) {
            this._elements.set(bulletElements.id, bulletElements);
            bulletElements.spawn(this._field.canvas, this._movementManager.entityStorage);
        }
    }
}