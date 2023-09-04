import {AIR_RESISTANCE_COEFFICIENT, RESISTANCE_COEFFICIENT} from "../constants/gameConstants";
import {DecorCreator} from "./creators/IDecorCreator";
import {CollisionManager} from "./managers/ICollisionManager";
import {Field} from "./Field";
import {Quadtree} from "../model/entitiy/IEntityCollisionSystem";
import {TankMovementManager} from "./managers/movement managers/TankMovementManager";
import {TankElement} from "./elements/TankElement";
import {KeyHandler} from "./KeyHandler";
import {ObstacleCreator} from "./creators/IObstacleCreator";
import {BackgroundSprite} from "../sprite/background/BackgroundSprite";
import {Point} from "../geometry/Point";
import {TireTracksManager} from "./managers/TireTracksManager";
import {WallMovementManager} from "./managers/movement managers/WallMovementManager";
import {ITankHandlingManagers, IWallHandlingManagers} from "./managers/handling managers/HandlingManagers";
import {TankHandlingManagers} from "./managers/handling managers/TankHandlingManagers";
import {WallHandlingManagers} from "./managers/handling managers/WallHandlingManagers";

export interface IGameMaster {
    startGameLoop(): void;
    stopGameLoop(): void;
    createField(backgroundMaterial: number, wallMaterial: number): void;
    addTankElements(...tankElements: TankElement[]): void;
}

export class GameMaster implements IGameMaster {
    private _isGameLoopActive: boolean = false;
    private _backgroundSprites: BackgroundSprite[] = [];

    private readonly _field: Field;
    private readonly _tankHandlingManagers: ITankHandlingManagers;
    private readonly _wallHandlingManagers: IWallHandlingManagers;
    private readonly _keyHandler: KeyHandler;
    public constructor(canvas: Element, width: number, height: number) {
        this._field = new Field(canvas, width, height);
        this._keyHandler = new KeyHandler();

        const entityCollisionSystem = new Quadtree(0, 0, width, height);
        const collisionManager = new CollisionManager(entityCollisionSystem);

        this._tankHandlingManagers = new TankHandlingManagers(
            [],
            new TankMovementManager(entityCollisionSystem, collisionManager),
            this._field,
            new TireTracksManager()
        );
        this._wallHandlingManagers = new WallHandlingManagers(
            [],
            new WallMovementManager(entityCollisionSystem, collisionManager),
            this._field
        );
    }

    public createField(backgroundMaterial: number, wallMaterial: number) {
        this.setCoefficients(backgroundMaterial);

        this.createBackgroundSprites(backgroundMaterial);
        this.createWalls(wallMaterial);
    }
    private setCoefficients(backgroundMaterial: number) {
        this._tankHandlingManagers.movementManager.resistanceCoeff = RESISTANCE_COEFFICIENT[backgroundMaterial];
        this._tankHandlingManagers.movementManager.airResistanceCoeff = AIR_RESISTANCE_COEFFICIENT;

        this._wallHandlingManagers.movementManager.resistanceCoeff = RESISTANCE_COEFFICIENT[backgroundMaterial];
        this._wallHandlingManagers.movementManager.airResistanceCoeff = AIR_RESISTANCE_COEFFICIENT;
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

        const wallElements = ObstacleCreator.createWallsAroundPerimeter(
            material, width, height);

        // Additional walls
        wallElements.push(ObstacleCreator.createWall(
            new Point(width >> 1, height >> 1), 0.79, 2, 0, true));
        wallElements.push(ObstacleCreator.createWall(
            new Point(width >> 2, height >> 2), 1, 2, 1, true));

        this._wallHandlingManagers.add(wallElements);
    }

    public addTankElements(...tankElements: TankElement[]) {
        this._tankHandlingManagers.add(tankElements);
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

        this._tankHandlingManagers.handle(this._keyHandler.keysMask);
        this._wallHandlingManagers.handle();

        requestAnimationFrame(() => this.gameLoop());
    }
}