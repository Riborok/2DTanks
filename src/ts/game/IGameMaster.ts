import {AIR_RESISTANCE_COEFFICIENT, RESISTANCE_COEFFICIENT} from "../constants/gameConstants";
import {DecorCreator} from "./creators/IDecorCreator";
import {CollisionManager} from "./managers/ICollisionManager";
import {Canvas} from "./Canvas";
import {Quadtree} from "../entitiy/IEntityCollisionSystem";
import {TankMovementManager} from "./managers/movement managers/TankMovementManager";
import {TankElement} from "./elements/TankElement";
import {IKeyHandler, KeyHandler} from "./IKeyHandler";
import {ObstacleCreator} from "./creators/IObstacleCreator";
import {BackgroundSprite} from "../sprite/background/BackgroundSprite";
import {Point} from "../geometry/Point";
import {WallMovementManager} from "./managers/movement managers/WallMovementManager";
import {TankHandlingManager} from "./managers/handling managers/TankHandlingManager";
import {WallHandlingManager} from "./managers/handling managers/WallHandlingManager";
import {WallElement} from "./elements/WallElement";
import {AnimationManager, IAnimationManager} from "./managers/AnimationManager";
import {BulletHandlingManager, BulletModelAdder} from "./managers/handling managers/BulletHandlingManager";
import {BulletElement} from "./elements/BulletElement";
import {BulletMovementManager} from "./managers/movement managers/BulletMovementManager";
import {HandlingManager} from "./managers/handling managers/HandlingManager";
import {IElement} from "./elements/IElement";
import {MovementManager} from "./managers/movement managers/MovementManager";
import {GameLoop, IGameLoop} from "./IGameLoop";
import {Size} from "../additionally/type";

export interface IGameMaster {
    get gameLoop(): IGameLoop;
    createField(backgroundMaterial: number, wallMaterial: number): void;
    addTankElements(...tankElements: TankElement[]): void;
}

export class GameMaster implements IGameMaster {
    private readonly _gameLoop: IGameLoop;
    private readonly _canvas: Canvas;
    private readonly _size: Size;

    private readonly _tankHandlingManagers: HandlingManager<TankElement, TankMovementManager>;
    private readonly _wallHandlingManagers: HandlingManager<WallElement, WallMovementManager>;
    private readonly _bulletHandlingManager: HandlingManager<BulletElement, BulletMovementManager>;

    private readonly _handlingManagers: HandlingManager<IElement, MovementManager>[] = new Array<HandlingManager<IElement, MovementManager>>;
    private readonly _animationManager: IAnimationManager;

    private readonly _keyHandler: IKeyHandler = new KeyHandler();
    public constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
        this._size = { width, height };
        this._canvas = new Canvas(ctx, this._size);
        this._gameLoop = new GameLoop(this._canvas);
        this._animationManager = new AnimationManager(this._canvas);

        const entityCollisionSystem = new Quadtree(0, 0, width, height);
        const collisionManager = new CollisionManager(entityCollisionSystem);

        const tankElements = new Map<number, TankElement>;
        const wallElements = new Map<number, WallElement>;
        const bulletElements = new Map<number, BulletElement>;

        const tankMovementManager = new TankMovementManager(entityCollisionSystem, collisionManager);
        const wallMovementManager = new WallMovementManager(entityCollisionSystem, collisionManager);
        const bulletMovementManager = new BulletMovementManager(entityCollisionSystem, collisionManager);

        const bulletAdder = new BulletModelAdder(bulletElements, this._canvas, bulletMovementManager);

        this._tankHandlingManagers = new TankHandlingManager(
            tankMovementManager,
            this._canvas,
            tankElements,
            bulletAdder,
            this._animationManager,
            this._keyHandler
        );
        this._wallHandlingManagers = new WallHandlingManager(
            wallMovementManager,
            this._canvas,
            wallElements
        );
        this._bulletHandlingManager = new BulletHandlingManager(
            bulletMovementManager,
            this._canvas, bulletElements,
            this._handlingManagers,
            this._animationManager
        );
        this._handlingManagers.push(this._tankHandlingManagers, this._wallHandlingManagers, this._bulletHandlingManager);

        this._gameLoop.render.add(...this._handlingManagers, this._animationManager);
    }
    public get gameLoop(): IGameLoop { return this._gameLoop }
    public createField(backgroundMaterial: number, wallMaterial: number) {
        this.setCoefficients(backgroundMaterial);

        this.createBackgroundSprites(backgroundMaterial);
        this.createWalls(wallMaterial);
    }
    private setCoefficients(backgroundMaterial: number) {
        for (const handlingManager of this._handlingManagers) {
            handlingManager.movementManager.resistanceCoeff = RESISTANCE_COEFFICIENT[backgroundMaterial];
            handlingManager.movementManager.airResistanceCoeff = AIR_RESISTANCE_COEFFICIENT;
        }
    }
    private createBackgroundSprites(material: number) {
        DecorCreator.fullFillBackground(material, this._size, this._canvas);
    }
    private createWalls(material: number) {
        this._wallHandlingManagers.add(ObstacleCreator.createWallsAroundPerimeter(material, this._size));

        // Additional walls
        const arr = new Array<WallElement>();
        arr.push(ObstacleCreator.createWall(
            new Point(this._size.width >> 1, this._size.height >> 1), 0.79, 2, 0, true));
        arr.push(ObstacleCreator.createWall(
            new Point(this._size.width >> 2, this._size.height >> 2), 1, 2, 1, true));
        this._wallHandlingManagers.add(arr);
    }
    public addTankElements(...tankElements: TankElement[]) {
        this._tankHandlingManagers.add(tankElements);
    }
}