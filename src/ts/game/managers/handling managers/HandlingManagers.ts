import {MovementManager} from "../movement managers/MovementManager";
import {IElement} from "../../elements/IElement";
import {TankElement} from "../../elements/TankElement";
import {Field} from "../../Field";
import {WallElement} from "../../elements/WallElement";
import {BulletElement} from "../../elements/BulletElement";
import {BulletModel} from "../../../model/bullet/BulletModel";

export abstract class HandlingManagers<T extends IElement, V extends MovementManager> {
    protected readonly _elements: Map<number, T>;
    protected readonly _movementManager: V;
    protected readonly _field: Field;
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
}

interface getMovementManager {
    get movementManager(): MovementManager;
}

export interface ITankHandlingManager extends getMovementManager {
    handle(mask: number, deltaTime: number): void;
    add(tankElements: Iterable<TankElement>): void;
}
export interface IWallHandlingManager extends getMovementManager {
    handle(deltaTime: number): void;
    add(wallElements: Iterable<WallElement>): void;
}
export interface IBulletHandlingManager extends getMovementManager, IAddBulletModel {
    handle(deltaTime: number): void;
    add(bulletElements: Iterable<BulletElement>): void;
}
export interface IAddBulletModel {
    addBulletModel(bulletModel: BulletModel, num: number): void;
}