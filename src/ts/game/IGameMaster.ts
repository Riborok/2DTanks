import {MATERIAL} from "../constants";
import {DecorCreator, IDecorCreator} from "./IDecorCreator";
import {CollisionManager, ICollisionManager} from "./ICollisionManager";
import {IObstacleCreator, ObstacleCreator} from "./IObstacleCreator";
import {Field} from "./Field";
import {Arr, IRectangularEntityStorage} from "../model/IRectangularEntityStorage";
import {IMovementManager, MovementManager} from "./IMovementManager";
import {TankElement} from "./TankElement";
import {KeyHandler} from "./KeyHandler";

export interface IGameMaster {
    startGameLoop(): void;
    stopGameLoop(): void;
    createField(): void;
    addTankElements(...tankElements: TankElement[]): void;
}

export class GameMaster implements IGameMaster {
    private readonly _field: Field;
    private readonly _rectangularEntityStorage: IRectangularEntityStorage;
    private readonly _collisionManager: ICollisionManager;
    private readonly _decorCreator: IDecorCreator;
    private readonly _obstacleCreator: IObstacleCreator;
    private readonly _movementManager: IMovementManager;
    private readonly _keyHandler: KeyHandler;
    private isGameLoopActive: boolean = false;
    private readonly _tankElements: TankElement[] = [];
    public constructor(canvas: Element, width: number, height: number) {
        this._field = new Field(canvas, width, height);
        //this._rectangularEntityStorage = new Quadtree(0, 0, width, height);
        this._rectangularEntityStorage = new Arr();
        this._collisionManager = new CollisionManager(this._rectangularEntityStorage);
        this._decorCreator = new DecorCreator(this._field);
        this._obstacleCreator = new ObstacleCreator(this._field, this._rectangularEntityStorage);
        this._movementManager = new MovementManager(this._rectangularEntityStorage, this._collisionManager);
        this._keyHandler = new KeyHandler();
    }

    public createField() {
        this._decorCreator.fullFillBackground(MATERIAL[1]);
        this._obstacleCreator.createObstaclesAroundPerimeter(MATERIAL[2]);

        // Additional obstacles
        this._obstacleCreator.createSquareObstacle(this._field.width >> 1, this._field.height >> 1, MATERIAL[2], 0.79);
        this._obstacleCreator.createRectObstacle(this._field.width >> 2, this._field.height >> 2, MATERIAL[2], 1);
    }

    public addTankElements(...tankElements: TankElement[]) {
        for (const tankElement of tankElements) {
            if (!this._tankElements.includes(tankElement)) {
                this._tankElements.push(tankElement);
                tankElement.spawn(this._field.canvas, this._rectangularEntityStorage);
            }
        }
    }

    // Game loop
    public startGameLoop() {
        if (!this.isGameLoopActive) {
            this.isGameLoopActive = true;
            this._keyHandler.clearMask();
            requestAnimationFrame(() => this.gameLoop());
        }
    }
    public stopGameLoop() {
        this.isGameLoopActive = false;
    }
    private gameLoop() {
        if (!this.isGameLoopActive)
            return;

        this.update();

        requestAnimationFrame(() => this.gameLoop());
    }
    private update() {
        const mask = this._keyHandler.keysMask;
        for (const tankElement of this._tankElements) {
            if (mask & tankElement.forwardMask)
                this._movementManager.moveForward(tankElement);
            if (mask & tankElement.backwardMask)
                this._movementManager.moveBackward(tankElement);
            if (mask & tankElement.hullClockwiseMask)
                this._movementManager.hullClockwiseMovement(tankElement);
            if (mask & tankElement.hullCounterClockwiseMask)
                this._movementManager.hullCounterclockwiseMovement(tankElement);
            if (mask & tankElement.turretClockwiseMask)
                this._movementManager.turretClockwiseMovement(tankElement);
            if (mask & tankElement.turretCounterClockwiseMask)
                this._movementManager.turretCounterclockwiseMovement(tankElement);
        }
    }
}