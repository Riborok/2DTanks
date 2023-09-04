import {MovementManager} from "../movement managers/MovementManager";
import {IElement} from "../../elements/IElement";
import {TankElement} from "../../elements/TankElement";
import {Field} from "../../Field";
import {WallElement} from "../../elements/WallElement";
import {findIndex} from "../../id/IIdentifiable";

export abstract class HandlingManagers<T extends IElement, V extends MovementManager> {
    protected _elements: T[];
    protected _movementManager: V;
    protected _field: Field;
    public constructor(elements: T[], movementManager: V, field: Field) {
        this._elements = elements;
        this._movementManager = movementManager;
        this._field = field;
    }
    public get movementManager(): V { return this._movementManager }
    public add(elements: T[]) {
        for (const element of elements)
            if (findIndex(this._elements, element.id) === -1) {
                this._elements.push(element);
                element.spawn(this._field.canvas, this._movementManager.entityStorage);
            }
    }
}

interface getMovementManager {
    get movementManager(): MovementManager;
}

export interface ITankHandlingManagers extends getMovementManager {
    handle(mask: number): void;
    add(tankElements: TankElement[]): void;
}
export interface IWallHandlingManagers extends getMovementManager {
    handle(): void;
    add(wallElements: WallElement[]): void;
}