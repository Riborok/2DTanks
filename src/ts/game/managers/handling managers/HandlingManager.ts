import {MovementManager} from "../movement managers/MovementManager";
import {IElement} from "../../elements/IElement";
import {Model} from "../../../model/Model";
import {IStorage} from "../../../additionally/type";
import {ISprite} from "../../../sprite/Sprite";

export interface IAddModel<T extends Model> {
    addBulletModel(t: T, num: number): void;
}

export interface IGetMovementManager {
    get movementManager(): MovementManager;
}
export interface IElementManager<T extends IElement> {
    delete(t: T): void;
    add(ts: Iterable<T>): void;
    get(id: number): T | null;
    get isResponsibleFor(): (id: number) => boolean;
}
export interface IExecutioner {
    handle(deltaTime: number): void;
}

export abstract class HandlingManager<T extends IElement, V extends MovementManager> implements
        IGetMovementManager, IElementManager<T>, IExecutioner {
    public abstract handle(deltaTime: number): void;

    protected readonly _elements: Map<number, T>;
    protected readonly _movementManager: V;
    protected readonly _storage: IStorage<ISprite>;
    protected readonly _isResponsibleFor: (id: number) => boolean;
    protected constructor(movementManager: V, storage: IStorage<ISprite>, elements: Map<number, T>, isResponsibleFor: (id: number) => boolean) {
        this._movementManager = movementManager;
        this._storage = storage;
        this._elements = elements;
        this._isResponsibleFor = isResponsibleFor;
    }
    public get movementManager(): V { return this._movementManager }
    public get isResponsibleFor(): (id: number) => boolean { return this._isResponsibleFor }
    public get(id: number): T | null {
        if (this._elements.has(id))
            return this._elements.get(id);

        return null;
    }
    public add(elements: Iterable<T>) {
        for (const element of elements) {
            if (!this._elements.has(element.id)) {
                this._elements.set(element.id, element);
                element.spawn(this._storage, this._movementManager.entityStorage);
            }
        }
    }
    public delete(element: T) {
        if (this._elements.has(element.id)) {
            this._elements.delete(element.id);
            element.vanish(this._storage, this._movementManager.entityStorage);
        }
    }
}