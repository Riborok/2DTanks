import {MovementManager} from "../movement managers/MovementManager";
import {IElement} from "../../elements/IElement";
import {TankElement} from "../../elements/TankElement";
import {Field} from "../../Field";
import {WallElement} from "../../elements/WallElement";
import {BulletElement} from "../../elements/BulletElement";
import {Model} from "../../../model/Model";

export abstract class HandlingManagers<T extends IElement, V extends MovementManager> {
    protected readonly _elements: Map<number, T>;
    protected readonly _movementManager: V;
    protected readonly _field: Field;
    public get(id: number): T | null {
        if (this._elements.has(id))
            return this._elements.get(id);

        return null;
    }
    public constructor(movementManager: V, field: Field, elements: Map<number, T>) {
        this._movementManager = movementManager;
        this._field = field;
        this._elements = elements;
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
    public delete(element: T) {
        if (this._elements.has(element.id)) {
            this._elements.delete(element.id);
            element.vanish(this._movementManager.entityStorage);
        }
    }
}

export interface IAddModel<T extends Model> {
    addBulletModel(t: T, num: number): void;
}
interface IGetMovementManager {
    get movementManager(): MovementManager;
}
export interface IElementHandling<T extends IElement> {
    delete(t: T): void;
    add(ts: Iterable<T>): void;
    get(id: number): T | null;
}
interface IElementHandler {
    handle(deltaTime: number): void;
}
interface IPlayerControl {
    handle(mask: number, deltaTime: number): void;
}

export interface ITankHandlingManager extends IGetMovementManager, IElementHandling<TankElement>, IPlayerControl {
}
export interface IWallHandlingManager extends IGetMovementManager, IElementHandling<WallElement>, IElementHandler {
}
export interface IBulletHandlingManager extends IGetMovementManager, IElementHandling<BulletElement>, IElementHandler {
}