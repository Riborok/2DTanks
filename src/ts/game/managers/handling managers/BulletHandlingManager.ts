import {HandlingManagers, IBulletHandlingManager} from "./HandlingManagers";
import {BulletElement} from "../../elements/BulletElement";
import {BulletMovementManager} from "../movement managers/BulletMovementManager";
import {DoublyLinkedList, IDoublyLinkedList} from "../../../additionally/data structures/IDoublyLinkedList";
import {TankElement} from "../../elements/TankElement";
import {WallElement} from "../../elements/WallElement";
import {Field} from "../../Field";
import {IElement} from "../../elements/IElement";
import {IDTracker} from "../../id/IDTracker";
import {BulletModel} from "../../../model/bullet/BulletModel";
import {BulletSprite} from "../../../sprite/bullet/BulletSprite";

export class BulletHandlingManager extends HandlingManagers<BulletElement, BulletMovementManager> implements IBulletHandlingManager {
    private readonly _bulletToProcess: IDoublyLinkedList<BulletElement> = new DoublyLinkedList<BulletElement>();

    private readonly _tankElements: Map<number, TankElement>;
    private readonly _wallElements: Map<number, WallElement>;

    public constructor(bulletManager: BulletMovementManager, field: Field, elements: Map<number, BulletElement>,
                       tankElements: Map<number, TankElement>, wallElements: Map<number, WallElement>) {
        super(bulletManager, field, elements);
        this._tankElements = tankElements;
        this._wallElements = wallElements;
    }

    public handle(): void {
        if (!this._bulletToProcess.isEmpty())
            this._bulletToProcess.applyAndRemove(this._movementManager.movement.bind(this._movementManager),
                this._movementManager.hasResidualMovement.bind(this._movementManager));
        if (this._movementManager.bulletAndModelIDs.hasForProcessing())
            this.handleBulletCollisions();
    }

    public addBulletModel(bulletModel: BulletModel, num: number) {
        if (!this._elements.has(bulletModel.entity.id)) {
            const bulletElements = new BulletElement(bulletModel, new BulletSprite(num));
            this._elements.set(bulletElements.id, bulletElements);
            bulletElements.spawn(this._field.canvas, this._movementManager.entityStorage);
        }
    }
    private handleBulletCollisions() {
        for (const bulletAndModelID of this._movementManager.bulletAndModelIDs.iterable)
            for (const id of bulletAndModelID.elementsIds)
                this.getElement(id).model.takeDamage(bulletAndModelID.bulletElement.model);

        this._movementManager.bulletAndModelIDs.clear();
    }
    private getElement(id: number): IElement {
        if (IDTracker.isWall(id))
            return this._wallElements.get(id);

        if (IDTracker.isTank(id))
            return this._tankElements.get(id);

        if (IDTracker.isBullet(id))
            return this._elements.get(id);
    }
}