import {Control, IExecutor, IRulesManager, Size, TankInfo} from "../../additionally/type";
import {
    Bonus,
    OBSTACLE_WALL_HEIGHT_AMOUNT,
    OBSTACLE_WALL_WIDTH_AMOUNT,
    ResolutionManager,
    SPAWN_GRIDS_COLUMNS_AMOUNT,
    SPAWN_GRIDS_LINES_AMOUNT,
} from "../../constants/gameConstants";
import {Point} from "../../geometry/Point";
import {TankElement} from "../elements/TankElement";
import {MazeCreator} from "../creators/MazeCreator";
import {WallElement} from "../elements/WallElement";
import {GameMaster, IGameMaster} from "../IGameMaster";
import {ObstacleCreator} from "../creators/IObstacleCreator";
import {
    VK_A,
    VK_B,
    VK_C,
    VK_COMMA,
    VK_D,
    VK_DOWN,
    VK_LEFT,
    VK_PERIOD,
    VK_RIGHT,
    VK_S,
    VK_SLASH,
    VK_UP,
    VK_V,
    VK_W
} from "../../constants/keyCodes";
import {IElement} from "../elements/IElement";
import {BonusSpawnManager, IBonusSpawnManager} from "../managers/additional/IBonusSpawnManager";
import {IPointSpawner, PointSpawner} from "../spawn/IPointSpawner";
import {ITankSpawnManager, TankSpawnManager} from "../managers/additional/ITankSpawnManager";

type CreateMaze = (wallMaterial: number, point: Point) => Iterable<WallElement>;
type NextMaze = (ctx: CanvasRenderingContext2D, size: Size, panelInfo: HTMLDivElement) => void;

export class Game0 {
    private constructor() { }
    private static get CONTROL_1(): Control {
        return {
            forwardKey: VK_W,
            backwardKey: VK_S,
            hullClockwiseKey: VK_D,
            hullCounterClockwiseKey: VK_A,
            turretClockwiseKey: VK_V,
            turretCounterClockwiseKey: VK_C,
            shootKey: VK_B
        }
    }
    private static get CONTROL_2(): Control {
        return {
            forwardKey: VK_UP,
            backwardKey: VK_DOWN,
            hullClockwiseKey: VK_RIGHT,
            hullCounterClockwiseKey: VK_LEFT,
            turretClockwiseKey: VK_PERIOD,
            turretCounterClockwiseKey: VK_COMMA,
            shootKey: VK_SLASH
        }
    }
    public static start(htmlCanvasElement: HTMLCanvasElement) {
        const panelInfo: HTMLDivElement = Game0.createInfoPanel(htmlCanvasElement);
        ResolutionManager.setResolutionResizeCoeff(htmlCanvasElement.width, htmlCanvasElement.height);

        const size: Size = { width: htmlCanvasElement.width, height: htmlCanvasElement.height }
        Game0.createMaze1(htmlCanvasElement.getContext('2d'), size, panelInfo);
    }
    private static createMaze1(ctx: CanvasRenderingContext2D, size: Size, panelInfo: HTMLDivElement) {
        let point = new Point(ResolutionManager.resizeX(103), ResolutionManager.resizeY(355));
        let tankInfo: TankInfo = {
            color: 0,
            hullNum: 0,
            trackNum: 0,
            turretNum: 0,
            weaponNum: 0,
            control: Game0.CONTROL_1,
        };
        const tank1 = new TankElement(point, 4.71,  tankInfo);

        point  = new Point(ResolutionManager.resizeX(1750), ResolutionManager.resizeY(850));
        tankInfo = {
            color: 1,
            hullNum: 0,
            trackNum: 0,
            turretNum: 0,
            weaponNum: 0,
            control: Game0.CONTROL_2,
        };
        const tank2 = new TankElement(point, 4.71, tankInfo);

        Game0.createMaze(ctx, size, 1, 2, tank1, tank2, panelInfo, MazeCreator.createMazeLvl1,
            Game0.createMaze2);
    }
    private static createMaze2(ctx: CanvasRenderingContext2D, size: Size, panelInfo: HTMLDivElement) {
        let point = new Point(ResolutionManager.resizeX(100), ResolutionManager.resizeY(845));
        let tankInfo: TankInfo = {
            color: 0,
            hullNum: 0,
            trackNum: 0,
            turretNum: 0,
            weaponNum: 0,
            control: Game0.CONTROL_1,
        };
        const tank1 = new TankElement(point, 0, tankInfo);

        point  = new Point(ResolutionManager.resizeX(1585), ResolutionManager.resizeY(845));
        tankInfo = {
            color: 1,
            hullNum: 0,
            trackNum: 0,
            turretNum: 0,
            weaponNum: 0,
            control: Game0.CONTROL_2,
        };
        const tank2 = new TankElement(point, 0, tankInfo);

        Game0.createMaze(ctx, size, 1, 2, tank1, tank2, panelInfo, MazeCreator.createMazeLvl2,
            Game0.createMaze3);
    }
    private static createMaze3(ctx: CanvasRenderingContext2D, size: Size, panelInfo: HTMLDivElement) {
        let point = new Point(ResolutionManager.resizeX(100), ResolutionManager.resizeY(845));
        let tankInfo: TankInfo = {
            color: 0,
            hullNum: 0,
            trackNum: 0,
            turretNum: 0,
            weaponNum: 0,
            control: Game0.CONTROL_1,
        };
        const tank1 = new TankElement(point, 0, tankInfo);

        point  = new Point(ResolutionManager.resizeX(1750), ResolutionManager.resizeY(845));
        tankInfo = {
            color: 1,
            hullNum: 0,
            trackNum: 0,
            turretNum: 0,
            weaponNum: 0,
            control: Game0.CONTROL_2,
        };
        const tank2 = new TankElement(point, 3.14, tankInfo);

        Game0.createMaze(ctx, size, 1, 2, tank1, tank2, panelInfo, MazeCreator.createMazeLvl3,
            Game0.endGame);
    }
    private static endGame(ctx: CanvasRenderingContext2D, size: Size, panelInfo: HTMLDivElement) {
        const img = new Image(size.width, size.height);
        img.src = `src/img/cat.jpg`;

        img.onload = () => {
            ctx.drawImage(img, 0, 0, size.width, size.height);
            panelInfo.textContent = 'The attacker wins';
        }
    }
    private static createMaze(ctx: CanvasRenderingContext2D, size: Size, backgroundMaterial: number, wallMaterial: number,
                              tank1: TankElement, tank2: TankElement, panelInfo: HTMLDivElement, createMaze: CreateMaze,
                              nextMaze: NextMaze) {
        const { wallsArray, point } = ObstacleCreator.createWallsAroundPerimeter(
            OBSTACLE_WALL_WIDTH_AMOUNT, OBSTACLE_WALL_HEIGHT_AMOUNT, wallMaterial, size
        );
        const pointSpawner = new PointSpawner(point, SPAWN_GRIDS_LINES_AMOUNT, SPAWN_GRIDS_COLUMNS_AMOUNT);

        const rulesManager = new RulesManager(tank1, tank2, nextMaze, panelInfo, ctx, size, pointSpawner);

        const gameMaster = rulesManager.gameMaster;
        gameMaster.setBackgroundMaterial(backgroundMaterial);
        gameMaster.addTankElements(tank1, tank2);

        gameMaster.addWallElements(wallsArray);
        gameMaster.addWallElements(createMaze(wallMaterial, point));

        const spawnManager: IBonusSpawnManager = new BonusSpawnManager(
            pointSpawner,
            gameMaster.itemCollisionManager
        );

        Game0.addKeys(spawnManager);

        gameMaster.addExecutioners(
            new PanelInfoManager(rulesManager),
            spawnManager
        );
    }
    private static readonly AMOUNT_OF_KEYS: number = 3;
    private static addKeys(spawnManager: IBonusSpawnManager) {
        for (let i = 0; i < Game0.AMOUNT_OF_KEYS; i++){
            spawnManager.randomSpawn(
                Bonus.key, ResolutionManager.KEY_SIZE, ResolutionManager.KEY_SIZE,
                0, SPAWN_GRIDS_LINES_AMOUNT - 1,
                Math.ceil(SPAWN_GRIDS_COLUMNS_AMOUNT / 2), SPAWN_GRIDS_COLUMNS_AMOUNT - 1
            );
        }
    }

    private static readonly PANEL_HEIGHT: number = 5;
    private static createInfoPanel(htmlCanvasElement: HTMLCanvasElement): HTMLDivElement {
        htmlCanvasElement.style.top = `${Game0.PANEL_HEIGHT}%`;
        htmlCanvasElement.style.height = `${100 - Game0.PANEL_HEIGHT}%`;

        const infoPanel = document.createElement('div');
        infoPanel.id = "info-panel";
        infoPanel.style.height = `${Game0.PANEL_HEIGHT}%`;

        document.body.appendChild(infoPanel);

        const keyCount = document.createElement('div');
        keyCount.id = "key-count";

        infoPanel.appendChild(keyCount);
        return keyCount;
    }
}

class RulesManager implements IRulesManager {
    private readonly _tankSpawnManager: ITankSpawnManager;
    private readonly _attacker: TankElement;
    private readonly _defender: TankElement;
    private _score: number = 0;

    private readonly _panelInfo: HTMLDivElement;
    private readonly _gameMaster: IGameMaster;
    private readonly _nextMaze: NextMaze;
    public constructor(attacker: TankElement, defender: TankElement, nextMaze: NextMaze,
                       panelInfo: HTMLDivElement, ctx: CanvasRenderingContext2D, size: Size,
                       pointSpawner: IPointSpawner) {
        this._attacker = attacker;
        this._defender = defender;

        this._panelInfo = panelInfo;
        this._gameMaster = new GameMaster(ctx, size, this);
        this._nextMaze = nextMaze;

        this._tankSpawnManager = new TankSpawnManager(pointSpawner,
            this._gameMaster.modelCollisionManager.collisionChecker, this._gameMaster);
    }
    public addBonus(source: IElement, bonus: Bonus): boolean {
        switch (bonus) {
            case Bonus.kill:
                return true;
            case Bonus.key:
                if (source === this._attacker) {
                    this._score++;
                    if (this.endGameConditions())
                        this.processPostGameActions();
                    return true;
                }
                break;
            case Bonus.bulGrenade:
            case Bonus.bulHeavy:
            case Bonus.bulLight:
            case Bonus.bulMedium:
            case Bonus.bulSniper:
                if (source instanceof TankElement) {
                    source.model.takeBullet(bonus);
                    return true;
                }
                break;
        }
        return false;
    }
    private endGameConditions(): boolean {
        return this._score === 3;
    }
    private processPostGameActions(): void {
        this._gameMaster.removeEventListeners();
        this._gameMaster.finishGame();
        this._nextMaze(this._gameMaster.ctx, this._gameMaster.size, this.panelInfo);
    }
    public get score(): number { return this._score }
    public get panelInfo(): HTMLDivElement { return this._panelInfo }
    public get gameMaster(): IGameMaster { return this._gameMaster }
}

class PanelInfoManager implements IExecutor {
    private readonly _rulesManager: RulesManager;
    private _lastScore: number = Infinity;
    public constructor(rulesManager: RulesManager) {
        this._rulesManager = rulesManager;
    }
    public handle() {
        if (this._lastScore !== this._rulesManager.score) {
            this._lastScore = this._rulesManager.score;
            this.updatePanel();
        }
    }
    private updatePanel() {
        this._rulesManager.panelInfo.textContent = `Amount of Keys: ${this._lastScore}`;
    }
}