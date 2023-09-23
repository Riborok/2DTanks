import {
    AIR_RESISTANCE_COEFFICIENT, OBSTACLE_WALL_HEIGHT_AMOUNT,
    OBSTACLE_WALL_WIDTH_AMOUNT,
    RESISTANCE_COEFFICIENT
} from "../constants/gameConstants";
import {DecorCreator} from "./creators/IDecorCreator";
import {CollisionManager} from "./managers/ICollisionManager";
import {Canvas, ICanvas} from "./ICanvas";
import {IPolygonCollisionSystem, Quadtree} from "../polygon/IPolygonCollisionSystem";
import {TankMovementManager} from "./managers/movement managers/TankMovementManager";
import {TankElement} from "./elements/TankElement";
import {IKeyHandler, KeyHandler} from "./IKeyHandler";
import {ObstacleCreator} from "./creators/IObstacleCreator";
import {Point} from "../geometry/Point";
import {WallMovementManager} from "./managers/movement managers/WallMovementManager";
import {TankHandlingManager} from "./managers/handling managers/TankHandlingManager";
import {WallHandlingManager} from "./managers/handling managers/WallHandlingManager";
import {WallElement} from "./elements/WallElement";
import {AnimationManager, IAnimationManager} from "./managers/animation managers/AnimationManager";
import {BulletHandlingManager, BulletModelAdder} from "./managers/handling managers/BulletHandlingManager";
import {BulletElement} from "./elements/BulletElement";
import {BulletMovementManager} from "./managers/movement managers/BulletMovementManager";
import {HandlingManager} from "./managers/handling managers/HandlingManager";
import {IElement} from "./elements/IElement";
import {MovementManager} from "./managers/movement managers/MovementManager";
import {GameLoop, IGameLoop} from "./IGameLoop";
import {Size} from "../additionally/type";
import {MazeCreator} from "./creators/MazeCreator";
import {IEntity} from "../polygon/entity/IEntity";

export interface IGameMaster {
    get gameLoop(): IGameLoop;
    createField(backgroundMaterial: number, wallMaterial: number): void;
    addTankElements(...tankElements: TankElement[]): void;
}

export class GameMaster implements IGameMaster {
    private readonly _gameLoop: IGameLoop;
    private readonly _canvas: ICanvas;
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

        const entityCollisionSystem: IPolygonCollisionSystem<IEntity> = new Quadtree<IEntity>(0, 0, width, height);
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
        this.createMaze(wallMaterial);
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
    private createMaze(material: number) {
        const {wallsArray, xIndent, yIndent } = ObstacleCreator.createWallsAroundPerimeter(
            OBSTACLE_WALL_WIDTH_AMOUNT, OBSTACLE_WALL_HEIGHT_AMOUNT, material, this._size
        );
        this._wallHandlingManagers.add(wallsArray);

        MazeCreator.calcGridPoints(new Point(xIndent, yIndent));
        MazeCreator.createMazeLvl1(this._wallHandlingManagers, material);
    }
    public addTankElements(...tankElements: TankElement[]) {
        this._tankHandlingManagers.add(tankElements);
    }
}