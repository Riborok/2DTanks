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
type NextMaze = (ctx: CanvasRenderingContext2D, size: Size, panelInfo: HTMLDivElement, attacker: TankInfo, defender: TankInfo) => void;

export class Game0 {
    private constructor() { }

    public static start(htmlCanvasElement: HTMLCanvasElement, attackerInfo: TankInfo, defenderInfo: TankInfo) {
        const panelInfo: HTMLDivElement = Game0.createInfoPanel(htmlCanvasElement);
        ResolutionManager.setResolutionResizeCoeff(htmlCanvasElement.width, htmlCanvasElement.height);

        const size: Size = { width: htmlCanvasElement.width, height: htmlCanvasElement.height }

        Game0.createMaze1(htmlCanvasElement.getContext('2d'), size, panelInfo, attackerInfo, defenderInfo);
    }
    private static createMaze1(ctx: CanvasRenderingContext2D, size: Size, panelInfo: HTMLDivElement, attacker: TankInfo, defender: TankInfo) {
        Game0.createMaze(ctx, size, 1, 2, attacker, defender, panelInfo, MazeCreator.createMazeLvl1,
            Game0.createMaze2);
    }
    private static createMaze2(ctx: CanvasRenderingContext2D, size: Size, panelInfo: HTMLDivElement, attacker: TankInfo, defender: TankInfo) {
        Game0.createMaze(ctx, size, 1, 2, attacker, defender, panelInfo, MazeCreator.createMazeLvl2,
            Game0.createMaze3);
    }
    private static createMaze3(ctx: CanvasRenderingContext2D, size: Size, panelInfo: HTMLDivElement, attacker: TankInfo, defender: TankInfo) {
        Game0.createMaze(ctx, size, 1, 2, attacker, defender, panelInfo, MazeCreator.createMazeLvl3,
            Game0.endGame);
    }
    private static endGame(ctx: CanvasRenderingContext2D, size: Size, panelInfo: HTMLDivElement, attacker: TankInfo, defender: TankInfo) {
        const img = new Image(size.width, size.height);
        img.src = `src/img/cat.jpg`;

        img.onload = () => {
            ctx.drawImage(img, 0, 0, size.width, size.height);
            panelInfo.textContent = 'The attacker wins';
        }
    }
    private static createMaze(ctx: CanvasRenderingContext2D, size: Size, backgroundMaterial: number, wallMaterial: number,
                              attacker: TankInfo, defender: TankInfo, panelInfo: HTMLDivElement, createMaze: CreateMaze,
                              nextMaze: NextMaze) {
        const { wallsArray, point } = ObstacleCreator.createWallsAroundPerimeter(
            OBSTACLE_WALL_WIDTH_AMOUNT, OBSTACLE_WALL_HEIGHT_AMOUNT, wallMaterial, size
        );
        const pointSpawner = new PointSpawner(point, SPAWN_GRIDS_LINES_AMOUNT, SPAWN_GRIDS_COLUMNS_AMOUNT);

        const rulesManager = new RulesManager(attacker, defender, nextMaze, panelInfo, ctx, size, pointSpawner);

        const gameMaster = rulesManager.gameMaster;
        gameMaster.setBackgroundMaterial(backgroundMaterial);

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
    private _attacker: TankElement;
    private _defender: TankElement;
    private _score: number = 0;

    private readonly _panelInfo: HTMLDivElement;
    private readonly _gameMaster: IGameMaster;
    private readonly _nextMaze: NextMaze;
    public constructor(attacker: TankInfo, defender: TankInfo, nextMaze: NextMaze,
                       panelInfo: HTMLDivElement, ctx: CanvasRenderingContext2D, size: Size,
                       pointSpawner: IPointSpawner) {
        this._panelInfo = panelInfo;
        this._gameMaster = new GameMaster(ctx, size, this);
        this._nextMaze = nextMaze;

        this._tankSpawnManager = new TankSpawnManager(pointSpawner,
            this._gameMaster.modelCollisionManager.collisionChecker, this._gameMaster);

        this.randomAttackerSpawn(attacker);
        this.randomDefenderSpawn(defender);
    }
    private randomAttackerSpawn(tankInfo: TankInfo) {
        this._attacker = this._tankSpawnManager.randomSpawn(
            tankInfo,
            0, SPAWN_GRIDS_LINES_AMOUNT - 1,
            0, Math.floor(SPAWN_GRIDS_COLUMNS_AMOUNT / 2)
        );
    }
    private randomDefenderSpawn(tankInfo: TankInfo) {
        this._defender = this._tankSpawnManager.randomSpawn(
            tankInfo,
            0, SPAWN_GRIDS_LINES_AMOUNT - 1,
            Math.ceil(SPAWN_GRIDS_COLUMNS_AMOUNT / 2), SPAWN_GRIDS_COLUMNS_AMOUNT - 1
        );
    }
    public addBonus(source: IElement, bonus: Bonus): boolean {
        switch (bonus) {
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
    public processKill(murderer: IElement, victim: IElement) {
        if (victim === this._attacker) {
            this.randomAttackerSpawn(this._attacker.tankInfo);
        }
        else if (victim === this._defender) {
            this.randomDefenderSpawn(this._defender.tankInfo);
        }
    }
    private endGameConditions(): boolean {
        return this._score === 3;
    }
    private processPostGameActions(): void {
        this._gameMaster.removeEventListeners();
        this._gameMaster.finishGame();
        this._nextMaze(this._gameMaster.ctx, this._gameMaster.size, this.panelInfo, this._attacker.tankInfo,
            this._defender.tankInfo);
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