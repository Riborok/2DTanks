import {MovementManager} from "../movement managers/MovementManager";
import {IElement} from "../../elements/IElement";
import {TankElement} from "../../elements/TankElement";
import {Field} from "../../Field";
import {WallElement} from "../../elements/WallElement";
import {BulletElement} from "../../elements/BulletElement";

export abstract class HandlingManagers<T extends IElement, V extends MovementManager> {
    protected _elements: Map<number, T> = new Map<number, T>();
    protected _movementManager: V;
    protected _field: Field;
    public constructor(movementManager: V, field: Field) {
        this._movementManager = movementManager;
        this._field = field;
    }
    public get movementManager(): V { return this._movementManager }
    public add(elements: Iterable<T>) {
        for (const element of elements) {
            if (!this._elements.has(element.id)) {
                this._elements.set(element.id, element);
                element.spawn(this._field.canvas, this._movementManager.entityStorage);
            }
        }
    }
}

interface getMovementManager {
    get movementManager(): MovementManager;
}

export interface ITankHandlingManager extends getMovementManager {
    handle(mask: number): void;
    add(tankElements: Iterable<TankElement>): void;
}
export interface IWallHandlingManager extends getMovementManager {
    handle(): void;
    add(wallElements: Iterable<WallElement>): void;
}
export interface IBulletHandlingManager extends getMovementManager {
    handle(): void;
    add(bulletElements: Iterable<BulletElement>): void;
    addElement(bulletElements: BulletElement): void;
}