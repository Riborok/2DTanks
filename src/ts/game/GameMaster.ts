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
    private readonly _tankElements: TankElement[] = [];
    public constructor(canvas: Element, width: number, height: number) {
        this._field = new Field(canvas, width, height);
        this._rectangularEntityStorage = new Quadtree(0, 0, width, height);
        //this._rectangularEntityStorage = new Arr();
        this._collisionManager = new CollisionManager(this._rectangularEntityStorage);
        this._decorCreator = new DecorCreator(this._field);
        this._obstacleCreator = new ObstacleCreator(this._field, this._rectangularEntityStorage);
        this._movementManager = new MovementManager(this._rectangularEntityStorage, this._collisionManager);
        this._keyHandler = new KeyHandler();
        this.startGameLoop();
    }

    public createField() {
        this._decorCreator.fullFillBackground(MATERIAL[1]);
        this._obstacleCreator.createObstaclesAroundPerimeter(MATERIAL[2]);
    }

    // TODO: КРИВУЛЬКА
    public createTank() {
        let tankElement = new TankElement(400, 400, 0, 1,
            0, 0, 0, 0,
            KeyHandler.W_MASK, KeyHandler.S_MASK, KeyHandler.D_MASK, KeyHandler.A_MASK,
            KeyHandler.Q_MASK, KeyHandler.E_MASK);
        tankElement.spawn(this._field.canvas, this._rectangularEntityStorage);
        this._tankElements.push(tankElement);

        // tankElement = new TankElement(800, 800, 0, 1,
        //     0, 0, 0, 0,
        //     KeyHandler.UP_MASK, KeyHandler.DOWN_MASK, KeyHandler.RIGHT_MASK, KeyHandler.LEFT_MASK);
        // tankElement.spawn(this._field.canvas, this._rectangularEntityStorage);
        // this._tankElements.push(tankElement);
    }

    // Game loop
    private startGameLoop() {
        this.isGameLoopActive = true;
        const gameLoop = () => {
            if (!this.isGameLoopActive)
                return;

            this.render();
            requestAnimationFrame(gameLoop);
        };
        gameLoop();
    }
    private stopGameLoop() {
        this.isGameLoopActive = false;
    }
    private render() {
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