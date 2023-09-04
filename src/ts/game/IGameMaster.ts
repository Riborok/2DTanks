import {AIR_RESISTANCE_COEFFICIENT, RESISTANCE_COEFFICIENT} from "../constants/gameConstants";
import {DecorCreator} from "./creators/IDecorCreator";
import {CollisionManager, ICollisionManager} from "./managers/ICollisionManager";
import {Field} from "./Field";
import {IEntityCollisionSystem, Quadtree} from "../model/entitiy/IEntityCollisionSystem";
import {IMovementManager, MovementManager} from "./managers/IMovementManager";
import {TankElement} from "./elements/TankElement";
import {KeyHandler} from "./KeyHandler";
import {WallElement} from "./elements/WallElement";
import {ObstacleCreator} from "./creators/IObstacleCreator";
import {findIndex} from "./id/IIdentifiable";
import {BackgroundSprite} from "../sprite/background/BackgroundSprite";
import {Point} from "../geometry/Point";
import {VanishingTireTracksManager} from "./managers/VanishingTireTrackManager";

export interface IGameMaster {
    startGameLoop(): void;
    stopGameLoop(): void;
    createField(backgroundMaterial: number, wallMaterial: number): void;
    addTankElements(...tankElements: TankElement[]): void;
}

export class GameMaster implements IGameMaster {
    private readonly _field: Field;
    private readonly _entityCollisionSystem: IEntityCollisionSystem;
    private readonly _collisionManager: ICollisionManager;
    private readonly _movementManager: IMovementManager;
    private readonly _keyHandler: KeyHandler;
    private _isGameLoopActive: boolean = false;
    private _backgroundSprites: BackgroundSprite[] = [];
    private _tankElements: TankElement[] = [];
    private _wallElements: WallElement[] = [];
    public constructor(canvas: Element, width: number, height: number) {
        this._field = new Field(canvas, width, height);
        this._entityCollisionSystem = new Quadtree(0, 0, width, height);
        this._collisionManager = new CollisionManager(this._entityCollisionSystem);
        this._movementManager = new MovementManager(this._entityCollisionSystem, this._collisionManager);
        this._keyHandler = new KeyHandler();
    }

    public createField(backgroundMaterial: number, wallMaterial: number) {
        this._movementManager.resistanceCoeff = RESISTANCE_COEFFICIENT[backgroundMaterial];
        this._movementManager.airResistanceCoeff = AIR_RESISTANCE_COEFFICIENT;

        this.createBackgroundSprites(backgroundMaterial);
        this.createWalls(wallMaterial);
    }

    private createBackgroundSprites(material: number) {
        this._backgroundSprites = this._backgroundSprites.concat(DecorCreator.fullFillBackground(
            material, this._field.width, this._field.height));

        for (const backgroundSprite of this._backgroundSprites)
            this._field.canvas.appendChild(backgroundSprite.sprite);
    }

    private createWalls(material: number) {
        const width = this._field.width;
        const height = this._field.height;

        this._wallElements = this._wallElements.concat(ObstacleCreator.createWallsAroundPerimeter(
            material, width, height));

        // Additional walls
        this._wallElements.push(ObstacleCreator.createWall(
            new Point(width >> 1, height >> 1), 0.79, 2, 0, false));
        this._wallElements.push(ObstacleCreator.createWall(
            new Point(width >> 2, height >> 2), 1, 2, 1, false));

        for (const wallElement of this._wallElements)
            wallElement.spawn(this._field.canvas, this._entityCollisionSystem);
    }

    public addTankElements(...tankElements: TankElement[]) {
        for (const tankElement of tankElements)
            if (findIndex(this._tankElements, tankElement.id) === -1) {
                this._tankElements.push(tankElement);
                tankElement.spawn(this._field.canvas, this._entityCollisionSystem);
            }
    }

    // Game loop
    public startGameLoop() {
        if (!this._isGameLoopActive) {
            this._isGameLoopActive = true;
            this._keyHandler.clearMask();
            requestAnimationFrame(() => this.gameLoop());
        }
    }
    public stopGameLoop() {
        this._isGameLoopActive = false;
    }
    private gameLoop() {
        if (!this._isGameLoopActive)
            return;

        VanishingTireTracksManager.reduceOpacity();
        this.update();

        requestAnimationFrame(() => this.gameLoop());
    }
    private update() {
        this.updateTanks();
        this.updateWalls();
    }
    private updateWalls() {
        // let currNode = this._wallToProcess.tail;
        // while (currNode !== null) {
        //     if (currNode.value.model.isIdle()) {
        //         const prevNode = currNode;
        //         currNode = currNode.next;
        //         this._wallToProcess.remove(prevNode);
        //     }
        //     else {
        //
        //         currNode = currNode.next;
        //     }
        // }
    }
    private updateTanks() {
        const mask = this._keyHandler.keysMask;
        for (const tankElement of this._tankElements) {
            const control = tankElement.control;

            let action = (mask & control.turretClockwiseMask) !== 0;
            let oppositeAction = (mask & control.turretCounterClockwiseMask) !== 0;
            if ((action && !oppositeAction) || (!action && oppositeAction)) {
                if (action)
                    this._movementManager.turretClockwiseMovement(tankElement);
                else if (oppositeAction)
                    this._movementManager.turretCounterclockwiseMovement(tankElement);
            }

            action = (mask & control.forwardMask) !== 0;
            oppositeAction = (mask & control.backwardMask) !== 0;
            if ((action && !oppositeAction) || (!action && oppositeAction)) {
                if (action)
                    this._movementManager.forwardMovement(tankElement);
                else if (oppositeAction) {
                    this._movementManager.removeSpriteAccelerationEffect(tankElement);
                    this._movementManager.backwardMovement(tankElement);
                }
            }
            else {
                this._movementManager.removeSpriteAccelerationEffect(tankElement);
                this._movementManager.residualMovement(tankElement);
            }

            action = (mask & control.hullClockwiseMask) !== 0;
            oppositeAction = (mask & control.hullCounterClockwiseMask) !== 0;
            if ((action && !oppositeAction) || (!action && oppositeAction)) {
                if (action)
                    this._movementManager.hullClockwiseMovement(tankElement);
                else if (oppositeAction)
                    this._movementManager.hullCounterclockwiseMovement(tankElement);
            }
            else
                this._movementManager.residualAngularMovement(tankElement);
        }
    }
}