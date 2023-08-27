import {RESISTANCE_COEFFICIENT} from "../constants/gameConstants";
import {DecorCreator, IDecorCreator} from "./IDecorCreator";
import {CollisionManager, ICollisionManager} from "./ICollisionManager";
import {IObstacleCreator, ObstacleCreator} from "./IObstacleCreator";
import {Field} from "./Field";
import {IEntityCollisionSystem, Quadtree} from "../model/entities/IEntityCollisionSystem";
import {IMovementManager, MovementManager} from "./IMovementManager";
import {TankElement} from "./TankElement";
import {KeyHandler} from "./KeyHandler";
import {RectangularEntity} from "../model/entities/IEntity";

export interface IGameMaster {
    startGameLoop(): void;
    stopGameLoop(): void;
    createField(backgroundMaterial: number, obstaclesMaterial: number): void;
    addTankElements(...tankElements: TankElement[]): void;
}

export class GameMaster implements IGameMaster {
    private readonly _field: Field;
    private readonly _entityCollisionSystem: IEntityCollisionSystem;
    private readonly _collisionManager: ICollisionManager;
    private readonly _decorCreator: IDecorCreator;
    private readonly _obstacleCreator: IObstacleCreator;
    private readonly _movementManager: IMovementManager;
    private readonly _keyHandler: KeyHandler;
    private isGameLoopActive: boolean = false;
    private _tankElements: TankElement[] = [];
    private _obstacles: RectangularEntity[];
    public constructor(canvas: Element, width: number, height: number) {
        this._field = new Field(canvas, width, height);
        this._entityCollisionSystem = new Quadtree(0, 0, width, height);
        this._collisionManager = new CollisionManager(this._entityCollisionSystem);
        this._decorCreator = new DecorCreator(this._field);
        this._obstacleCreator = new ObstacleCreator(this._field, this._entityCollisionSystem);
        this._movementManager = new MovementManager(this._entityCollisionSystem, this._collisionManager);
        this._keyHandler = new KeyHandler();
    }

    public createField(backgroundMaterial: number, obstaclesMaterial: number) {
        this._movementManager.setResistanceForce(RESISTANCE_COEFFICIENT[backgroundMaterial]);
        this._decorCreator.fullFillBackground(backgroundMaterial);
        this._obstacles = this._obstacleCreator.createObstaclesAroundPerimeter(obstaclesMaterial);

        // Additional obstacles
        this._obstacles.push(this._obstacleCreator.createSquareObstacle(
            this._field.width >> 1, this._field.height >> 1, 0.79, 2, true));
        this._obstacles.push(this._obstacleCreator.createRectObstacle(
            this._field.width >> 2, this._field.height >> 2, 1, 2, true));
    }

    public addTankElements(...tankElements: TankElement[]) {
        for (const tankElement of tankElements) {
            if (!this._tankElements.includes(tankElement)) {
                this._tankElements.push(tankElement);
                tankElement.spawn(this._field.canvas, this._entityCollisionSystem);
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
        this.updateTanks();
    }
    private updateTanks() {
        const mask = this._keyHandler.keysMask;
        for (const tankElement of this._tankElements) {
            if (mask & tankElement.turretClockwiseMask)
                this._movementManager.turretClockwiseMovement(tankElement);
            if (mask & tankElement.turretCounterClockwiseMask)
                this._movementManager.turretCounterclockwiseMovement(tankElement);

            if (mask & tankElement.forwardMask)
                this._movementManager.forwardMovement(tankElement);
            else {
                this._movementManager.removeSpriteAccelerationEffect(tankElement);
                if (mask & tankElement.backwardMask)
                    this._movementManager.backwardMovement(tankElement);
                else
                    this._movementManager.residualMovement(tankElement);
            }

            if (mask & tankElement.hullClockwiseMask)
                this._movementManager.hullClockwiseMovement(tankElement);
            if (mask & tankElement.hullCounterClockwiseMask)
                this._movementManager.hullCounterclockwiseMovement(tankElement);
        }
    }
}