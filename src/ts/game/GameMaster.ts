import {MATERIAL} from "../constants";
import {DecorCreator, IDecorCreator} from "./IDecorCreator";
import {CollisionManager, ICollisionManager} from "./ICollisionManager";
import {IObstacleCreator, ObstacleCreator} from "./IObstacleCreator";
import {Field} from "./Field";
import {IRectangularEntityStorage, Quadtree} from "../model/IRectangularEntityStorage";
import {IMovementManager, MovementManager} from "./IMovementManager";
import {TankElement} from "./TankElement";
import {KeyHandler} from "./KeyHandler";

export class GameMaster {
    private readonly _field: Field;
    private readonly _rectangularEntityStorage: IRectangularEntityStorage;
    private readonly _collisionManager: ICollisionManager;
    private readonly _decorCreator: IDecorCreator;
    private readonly _obstacleCreator: IObstacleCreator;
    private readonly _movementManager: IMovementManager;
    private readonly _keyHandler: KeyHandler;
    private isGameLoopActive: boolean;
    public constructor(canvas: Element, width: number, height: number) {
        this._field = new Field(canvas, width, height);
        this._rectangularEntityStorage = new Quadtree(0, 0, width, height);
        this._collisionManager = new CollisionManager(this._rectangularEntityStorage);
        this._decorCreator = new DecorCreator(this._field);
        this._obstacleCreator = new ObstacleCreator(this._field, this._rectangularEntityStorage);
        this._movementManager = new MovementManager(this._rectangularEntityStorage, this._collisionManager);
        this._keyHandler = new KeyHandler(this._movementManager);
        this.startGameLoop();
    }

    public createField() {
        this._decorCreator.fullFillBackground(MATERIAL[1]);
        this._obstacleCreator.createObstaclesAroundPerimeter(MATERIAL[2]);
    }

    // TODO: КРИВУЛЬКА
    public createTank() {
        let tankElement = new TankElement(this._field.canvas, 400, 400, 0, 0,
            0, 0, 0, 0);
        this._movementManager.display(tankElement);
        this._keyHandler.addTankElement(tankElement);

        // tankElement = new TankElement(this._field.canvas, 800, 800, 0, 1,
        //     0, 0, 0, 0);
        // this._movementManager.display(tankElement);
        // this._keyHandler.addTankElement(tankElement);
    }

    // Game loop
    private startGameLoop() {
        this.isGameLoopActive = true;
        const gameLoop = () => {
            if (!this.isGameLoopActive)
                return;

            this._keyHandler.handleKeys();
            requestAnimationFrame(gameLoop);
        };
        gameLoop();
    }
    private stopGameLoop() {
        this.isGameLoopActive = false;
    }
}