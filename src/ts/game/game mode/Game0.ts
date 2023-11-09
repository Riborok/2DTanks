import {IExecutor, IRulesManager, Size, TankInfo} from "../../additionally/type";
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
import {IElement} from "../elements/IElement";
import {BonusSpawnManager, IBonusSpawnManager} from "../managers/additional/IBonusSpawnManager";
import {IPointSpawner, PointSpawner} from "../spawn/IPointSpawner";
import {ITankSpawnManager, TankSpawnManager} from "../managers/additional/ITankSpawnManager";

type CreateMaze = (wallMaterial: number, point: Point) => Iterable<WallElement>;
type NextMaze = (ctx: CanvasRenderingContext2D, size: Size, panelInfo: PanelInfo, attacker: TankInfo, defender: TankInfo) => void;
type CompleteGame = (ctx: CanvasRenderingContext2D, size: Size, panelInfo: PanelInfo, isAttackerWin: boolean) => void;

type PanelInfo = {
    keyPanel: HTMLDivElement,
    timePanel: HTMLDivElement,
};

export class Game0 {
    private constructor() { }

    public static start(htmlCanvasElement: HTMLCanvasElement, attackerInfo: TankInfo, defenderInfo: TankInfo) {
        const panelInfo = Game0.createInfoPanel(htmlCanvasElement);
        ResolutionManager.setResolutionResizeCoeff(htmlCanvasElement.width);

        const size: Size = { width: htmlCanvasElement.width, height: htmlCanvasElement.height }

        Game0.createMaze1(htmlCanvasElement.getContext('2d'), size, panelInfo, attackerInfo, defenderInfo);
    }
    private static createMaze1(ctx: CanvasRenderingContext2D, size: Size, panelInfo: PanelInfo, attacker: TankInfo, defender: TankInfo) {
        Game0.createMaze(ctx, size, 1, 2, attacker, defender, panelInfo, MazeCreator.createMazeLvl1,
            Game0.createMaze2);
    }
    private static createMaze2(ctx: CanvasRenderingContext2D, size: Size, panelInfo: PanelInfo, attacker: TankInfo, defender: TankInfo) {
        Game0.createMaze(ctx, size, 2, 1, attacker, defender, panelInfo, MazeCreator.createMazeLvl2,
            Game0.createMaze3);
    }
    private static createMaze3(ctx: CanvasRenderingContext2D, size: Size, panelInfo: PanelInfo, attacker: TankInfo, defender: TankInfo) {
        Game0.createMaze(ctx, size, 0, 0, attacker, defender, panelInfo, MazeCreator.createMazeLvl3,
            Game0.giveAttackerVictory);
    }
    private static giveAttackerVictory(ctx: CanvasRenderingContext2D, size: Size, panelInfo: PanelInfo, attacker: TankInfo, defender: TankInfo) {
        Game0.completeGame(ctx, size, panelInfo, true);
    }
    private static completeGame(ctx: CanvasRenderingContext2D, size: Size, panelInfo: PanelInfo, isAttackerWin: boolean) {
        const img = new Image(size.width, size.height);
        img.src = `src/img/cat.jpg`;

        img.onload = () => {
            ctx.drawImage(img, 0, 0, size.width, size.height);
            panelInfo.keyPanel.textContent = isAttackerWin ? 'The attacker wins' : 'The defender wins';
            panelInfo.timePanel.remove();
        };
    }
    private static createMaze(ctx: CanvasRenderingContext2D, size: Size, backgroundMaterial: number, wallMaterial: number,
                              attacker: TankInfo, defender: TankInfo, panelInfo: PanelInfo, createMaze: CreateMaze,
                              nextMaze: NextMaze) {
        const { wallsArray, point } = ObstacleCreator.createWallsAroundPerimeter(
            OBSTACLE_WALL_WIDTH_AMOUNT, OBSTACLE_WALL_HEIGHT_AMOUNT, wallMaterial, size
        );
        const pointSpawner = new PointSpawner(point, SPAWN_GRIDS_LINES_AMOUNT, SPAWN_GRIDS_COLUMNS_AMOUNT);

        const rulesManager = new RulesManager(attacker, defender, nextMaze, panelInfo, ctx, size, pointSpawner, Game0.completeGame);

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
            new ScoreInfoManager(rulesManager),
            new TimeInfoManager(rulesManager),
            spawnManager
        );

        gameMaster.addEventListeners();
        gameMaster.startGame();
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
    private static createInfoPanel(htmlCanvasElement: HTMLCanvasElement): PanelInfo {
        htmlCanvasElement.style.top = `${Game0.PANEL_HEIGHT}%`;
        htmlCanvasElement.style.height = `${100 - Game0.PANEL_HEIGHT}%`;

        const infoPanel = document.createElement('div');
        infoPanel.id = "info-panel";
        infoPanel.style.height = `${Game0.PANEL_HEIGHT}%`;

        document.body.appendChild(infoPanel);

        const timePanel = document.createElement('div');
        timePanel.id = "time-count";
        infoPanel.appendChild(timePanel);

        const keyPanel = document.createElement('div');
        keyPanel.id = "key-count";
        infoPanel.appendChild(keyPanel);

        return { keyPanel, timePanel };
    }
}

interface IScoreInfo {
    get keyPanel(): HTMLDivElement;
    get score(): number;
}
interface ITimeInfo {
    get timePanel(): HTMLDivElement;
    get finishTime(): number;
    giveDefenderVictory(): void;
}

class RulesManager implements IRulesManager, IScoreInfo, ITimeInfo {
    private static readonly FINISH_TIME: number = 300;

    private readonly _tankSpawnManager: ITankSpawnManager;
    private _attacker: TankElement;
    private _defender: TankElement;
    private _score: number = 0;

    private readonly _panelInfo: PanelInfo;
    private readonly _gameMaster: IGameMaster;
    private readonly _nextMaze: NextMaze;
    private readonly _completeGame: CompleteGame;
    public constructor(attacker: TankInfo, defender: TankInfo, nextMaze: NextMaze,
                       panelInfo: PanelInfo, ctx: CanvasRenderingContext2D, size: Size,
                       pointSpawner: IPointSpawner, completeGame: CompleteGame) {
        this._panelInfo = panelInfo;
        this._gameMaster = new GameMaster(ctx, size, this);
        this._nextMaze = nextMaze;
        this._completeGame = completeGame;

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
        this._nextMaze(this._gameMaster.ctx, this._gameMaster.size, this._panelInfo, this._attacker.tankInfo,
            this._defender.tankInfo);
    }
    public giveDefenderVictory(): void {
        this._gameMaster.removeEventListeners();
        this._gameMaster.finishGame();
        this._completeGame(this._gameMaster.ctx, this._gameMaster.size, this._panelInfo, false);
    }
    public get score(): number { return this._score }
    public get keyPanel(): HTMLDivElement { return this._panelInfo.keyPanel }
    public get timePanel(): HTMLDivElement { return this._panelInfo.timePanel }
    public get gameMaster(): IGameMaster { return this._gameMaster }
    public get finishTime(): number { return RulesManager.FINISH_TIME }
}

class TimeInfoManager implements IExecutor {
    private static readonly SECOND: number = 1000;

    private readonly _timeInfo: ITimeInfo;
    private _elapsedTime: number = 0;
    private _counter = 0;
    public constructor(timeInfo: ITimeInfo) {
        this._timeInfo = timeInfo;
    }
    public handle(deltaTime: number) {
        this._counter += deltaTime;
        if (this._counter >= TimeInfoManager.SECOND) {
            this._counter -= TimeInfoManager.SECOND;
            this.updatePanel();
        }
    }
    private updatePanel() {
        this._timeInfo.timePanel.textContent = `Elapsed time: ${++this._elapsedTime}`;
        if (this._elapsedTime > this._timeInfo.finishTime) { this._timeInfo.giveDefenderVictory(); }
    }
}

class ScoreInfoManager implements IExecutor {
    private readonly _scoreData: IScoreInfo;
    private _lastScore: number = Infinity;
    public constructor(scoreData: IScoreInfo) {
        this._scoreData = scoreData;
    }
    public handle() {
        if (this._lastScore !== this._scoreData.score) {
            this._lastScore = this._scoreData.score;
            this.updatePanel();
        }
    }
    private updatePanel() {
        this._scoreData.keyPanel.textContent = `Amount of Keys: ${this._lastScore}`;
    }
}