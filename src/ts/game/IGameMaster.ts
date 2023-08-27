import {RESISTANCE_COEFFICIENT} from "../constants/gameConstants";
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
        this._movementManager.setResistanceForce(RESISTANCE_COEFFICIENT[backgroundMaterial]);

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
            width >> 1, height >> 1, 0.79, 2, 0, true));
        this._wallElements.push(ObstacleCreator.createWall(
            width >> 2, height >> 2, 1, 2, 1, true));

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