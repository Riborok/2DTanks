import {AIR_RESISTANCE_COEFFICIENT, RESISTANCE_COEFFICIENT} from "../constants/gameConstants";
import {DecorCreator} from "./creators/IDecorCreator";
import {CollisionManager} from "./managers/ICollisionManager";
import {Field} from "./Field";
import {Quadtree} from "../entitiy/IEntityCollisionSystem";
import {TankMovementManager} from "./managers/movement managers/TankMovementManager";
import {TankElement} from "./elements/TankElement";
import {KeyHandler} from "./KeyHandler";
import {ObstacleCreator} from "./creators/IObstacleCreator";
import {BackgroundSprite} from "../sprite/background/BackgroundSprite";
import {Point} from "../geometry/Point";
import {WallMovementManager} from "./managers/movement managers/WallMovementManager";
import {
    IBulletHandlingManager,
    ITankHandlingManager,
    IWallHandlingManager
} from "./managers/handling managers/HandlingManagers";
import {TankHandlingManager} from "./managers/handling managers/TankHandlingManager";
import {WallHandlingManager} from "./managers/handling managers/WallHandlingManager";
import {WallElement} from "./elements/WallElement";
import {AnimationManager} from "./managers/AnimationManager";
import {BulletHandlingManager} from "./managers/handling managers/BulletHandlingManager";
import {BulletElement} from "./elements/BulletElement";
import {BulletMovementManager} from "./managers/movement managers/BulletMovementManager";

export interface IGameMaster {
    startGameLoop(): void;
    stopGameLoop(): void;
    createField(backgroundMaterial: number, wallMaterial: number): void;
    addTankElements(...tankElements: TankElement[]): void;
}

export class GameMaster implements IGameMaster {
    private _isGameLoopActive: boolean = false;
    private _backgroundSprites: BackgroundSprite[] = new Array<BackgroundSprite>();

    private readonly _field: Field;
    private readonly _tankHandlingManagers: ITankHandlingManager;
    private readonly _wallHandlingManagers: IWallHandlingManager;
    private readonly _bulletHandlingManager: IBulletHandlingManager;
    private readonly _animationManager: AnimationManager = new AnimationManager();
    private readonly _keyHandler: KeyHandler;
    public constructor(canvas: Element, width: number, height: number) {
        this._field = new Field(canvas, width, height);
        this._keyHandler = new KeyHandler();

        const entityCollisionSystem = new Quadtree(0, 0, width, height);
        const collisionManager = new CollisionManager(entityCollisionSystem);

        const tankElements = new Map<number, TankElement>;
        const wallElements = new Map<number, WallElement>;
        const bulletElements = new Map<number, BulletElement>;

        this._bulletHandlingManager = new BulletHandlingManager(
            new BulletMovementManager(entityCollisionSystem, collisionManager),
            this._field, bulletElements, tankElements, wallElements
        );
        this._tankHandlingManagers = new TankHandlingManager(
            new TankMovementManager(entityCollisionSystem, collisionManager),
            this._field, tankElements, this._bulletHandlingManager, this._animationManager
        );
        this._wallHandlingManagers = new WallHandlingManager(
            new WallMovementManager(entityCollisionSystem, collisionManager),
            this._field, wallElements
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

        this._bulletHandlingManager.movementManager.resistanceCoeff = RESISTANCE_COEFFICIENT[backgroundMaterial];
        this._bulletHandlingManager.movementManager.airResistanceCoeff = AIR_RESISTANCE_COEFFICIENT;
    }
    private createBackgroundSprites(material: number) {
        DecorCreator.fullFillBackground(material, this._field.width, this._field.height, this._backgroundSprites);

        for (const backgroundSprite of this._backgroundSprites)
            this._field.canvas.appendChild(backgroundSprite.sprite);
    }
    private createWalls(material: number) {
        const width = this._field.width;
        const height = this._field.height;
        this._wallHandlingManagers.add(ObstacleCreator.createWallsAroundPerimeter(material, width, height));

        // Additional walls
        const arr = new Array<WallElement>();
        arr.push(ObstacleCreator.createWall(
            new Point(width >> 1, height >> 1), 0.79, 2, 0, true));
        arr.push(ObstacleCreator.createWall(
            new Point(width >> 2, height >> 2), 1, 2, 1, true));
        this._wallHandlingManagers.add(arr);
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
        this._animationManager.handle();

        requestAnimationFrame(() => this.gameLoop());
    }
}