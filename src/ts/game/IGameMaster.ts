import {AIR_RESISTANCE_COEFFICIENT, RESISTANCE_COEFFICIENT} from "../constants/gameConstants";
import {DecorCreator} from "./creators/IDecorCreator";
import {IModelCollisionManager, ModelCollisionManager} from "./managers/IModelCollisionManager";
import {Canvas, ICanvas} from "./processors/ICanvas";
import {ICollisionSystem, Quadtree} from "../polygon/ICollisionSystem";
import {TankMovementManager} from "./managers/movement managers/TankMovementManager";
import {TankElement} from "./elements/TankElement";
import {IKeyHandler, KeyHandler} from "./input/IKeyHandler";
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
import {GameLoop, IGameLoop} from "./processors/IGameLoop";
import {IEventEmitter, IExecutor, IRulesManager, Size} from "../additionally/type";
import {IEntity} from "../polygon/entity/IEntity";
import {ICollectibleItemManager, CollectibleItemManager} from "./bonuses/ICollectibleItemManager";
import {ICollectibleItem} from "./bonuses/ICollectibleItem";

export interface IGameMaster extends IEventEmitter {
    setBackgroundMaterial(backgroundMaterial: number): void;

    addWallElements(wallElements: Iterable<WallElement>): void;
    addTankElements(...tankElements: TankElement[]): void;
    addBonuses(...collectibleItem: ICollectibleItem[]): void;
    addExecutioners(...executioners: IExecutor[]): void;
}

export class GameMaster implements IGameMaster {
    private readonly _gameLoop: IGameLoop;
    private readonly _canvas: ICanvas;
    private readonly _size: Size;

    private readonly _itemCollisionManager: ICollectibleItemManager;

    private readonly _tankHandlingManagers: HandlingManager<TankElement, TankMovementManager>;
    private readonly _wallHandlingManagers: HandlingManager<WallElement, WallMovementManager>;
    private readonly _bulletHandlingManager: HandlingManager<BulletElement, BulletMovementManager>;

    private readonly _handlingManagers: HandlingManager<IElement, MovementManager>[] =
        new Array<HandlingManager<IElement, MovementManager>>;
    private readonly _animationManager: IAnimationManager;

    private readonly _keyHandler: IKeyHandler = new KeyHandler();

    private readonly handleVisibilityChange = () => {
        if (document.hidden) {
            this._gameLoop.stop();
            this._keyHandler.clearKeys();
        }
        else {
            this._gameLoop.start();
        }
    };
    public constructor(ctx: CanvasRenderingContext2D, size: Size, rulesManager: IRulesManager) {
        document.addEventListener("visibilitychange", this.handleVisibilityChange);

        this._size = size;
        this._canvas = new Canvas(ctx, this._size);
        this._gameLoop = new GameLoop(this._canvas);
        this._animationManager = new AnimationManager(this._canvas);

        const entityCollisionSystem: ICollisionSystem<IEntity> = new Quadtree<IEntity>(0, 0,
            this._size.width, this._size.height);
        const collisionManager: IModelCollisionManager = new ModelCollisionManager(entityCollisionSystem);

        const tankElements = new Map<number, TankElement>;
        const wallElements = new Map<number, WallElement>;
        const bulletElements = new Map<number, BulletElement>;

        const tankMovementManager = new TankMovementManager(entityCollisionSystem, collisionManager);
        const wallMovementManager = new WallMovementManager(entityCollisionSystem, collisionManager);
        const bulletMovementManager = new BulletMovementManager(entityCollisionSystem, collisionManager);

        const bulletAdder = new BulletModelAdder(bulletElements, this._canvas, bulletMovementManager);

        this._itemCollisionManager = new CollectibleItemManager(this._canvas, rulesManager, this._size);

        this._tankHandlingManagers = new TankHandlingManager(
            tankMovementManager,
            this._canvas,
            tankElements,
            bulletAdder,
            this._animationManager,
            this._keyHandler,
            this._itemCollisionManager
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
            this._animationManager,
            rulesManager
        );
        this._handlingManagers.push(this._tankHandlingManagers, this._wallHandlingManagers, this._bulletHandlingManager);

        this._gameLoop.render.add(...this._handlingManagers, this._animationManager);
        this._gameLoop.start();
    }
    public removeEventListeners() {
        this._keyHandler.removeEventListeners();
        document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    }
    public setBackgroundMaterial(backgroundMaterial: number) {
        this.setCoefficients(backgroundMaterial);

        this.createBackgroundSprites(backgroundMaterial);
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
    public addWallElements(wallElements: Iterable<WallElement>) {
        this._wallHandlingManagers.add(wallElements);
    }
    public addTankElements(...tankElements: TankElement[]) {
        this._tankHandlingManagers.add(tankElements);
    }
    public addBonuses(...collectibleItem: ICollectibleItem[]) {
        this._itemCollisionManager.add(collectibleItem);
    }
    public addExecutioners(...executioners: IExecutor[]) {
        this._gameLoop.render.add(...executioners);
    }
}