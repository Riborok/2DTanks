import {Control, IExecutor, IRulesManager, Size} from "../../additionally/type";
import {
    Bonus,
    OBSTACLE_WALL_HEIGHT_AMOUNT,
    OBSTACLE_WALL_WIDTH_AMOUNT,
    ResolutionManager
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
import {CollectibleItemCreator} from "../bonuses/CollectibleItemCreator";

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

        Game0.createMaze1(htmlCanvasElement, panelInfo);
    }
    private static createMaze1(htmlCanvasElement: HTMLCanvasElement, panelInfo: HTMLDivElement) {
        const size: Size = { width: htmlCanvasElement.width, height: htmlCanvasElement.height }
        const ctx = htmlCanvasElement.getContext('2d');

        // let point = new Point(ResolutionManager.resizeX(180), ResolutionManager.resizeY(210));
        let point = new Point(ResolutionManager.resizeX(1555), ResolutionManager.resizeY(680));
        const tank1 = new TankElement(point, 0, 0,
            0, 0, 0, 0, Game0.CONTROL_1);

        point  = new Point(ResolutionManager.resizeX(1750), ResolutionManager.resizeY(850));
        const tank2 = new TankElement(point, 4.71, 1,
            0, 0, 0, 0, Game0.CONTROL_2);

        Game0.createMaze(ctx, size, 1, 2, tank1, tank2, panelInfo, MazeCreator.createMazeLvl1);
    }
    private static createMaze(ctx: CanvasRenderingContext2D, size: Size, backgroundMaterial: number, wallMaterial: number,
                              tank1: TankElement, tank2: TankElement, panelInfo: HTMLDivElement,
                              createMaze: (wallMaterial: number, point: Point) => Iterable<WallElement>) {
        const rulesManager = new RulesManager(tank1, tank2, panelInfo, ctx, size);

        const gameMaster = rulesManager.gameMaster;
        gameMaster.setBackgroundMaterial(backgroundMaterial);
        gameMaster.addExecutioners(new PanelInfoManager(rulesManager));

        gameMaster.addBonuses(CollectibleItemCreator.create(Bonus.key,
            new Point(ResolutionManager.resizeX(790), ResolutionManager.resizeY(680)),
            0)
        );
        gameMaster.addBonuses(CollectibleItemCreator.create(Bonus.key,
            new Point(ResolutionManager.resizeX(1690), ResolutionManager.resizeY(380)),
            0)
        );
        gameMaster.addBonuses(CollectibleItemCreator.create(Bonus.key,
            new Point(ResolutionManager.resizeX(1385), ResolutionManager.resizeY(495)),
            0)
        );

        gameMaster.addTankElements(tank1, tank2);

        const {wallsArray, point } = ObstacleCreator.createWallsAroundPerimeter(
            OBSTACLE_WALL_WIDTH_AMOUNT, OBSTACLE_WALL_HEIGHT_AMOUNT, wallMaterial, size);
        gameMaster.addWallElements(wallsArray);
        gameMaster.addWallElements(createMaze(wallMaterial, point));
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
    private _score: number = 0;
    private readonly _attacker: TankElement;
    private readonly _defender: TankElement;
    private readonly _panelInfo: HTMLDivElement;
    private readonly _gameMaster: IGameMaster;
    public constructor(attacker: TankElement, defender: TankElement, panelInfo: HTMLDivElement, ctx: CanvasRenderingContext2D, size: Size) {
        this._attacker = attacker;
        this._defender = defender;
        this._panelInfo = panelInfo;
        this._gameMaster = new GameMaster(ctx, size, this);
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
        }
        return false;
    }
    private endGameConditions(): boolean {
        return this._score === 3;
    }
    private processPostGameActions(): void {
        this._gameMaster.removeEventListeners();
        this._gameMaster.finishGame();
    }
    public get score(): number { return this._score }
    public get panelInfo(): HTMLDivElement { return this._panelInfo }
    public get gameMaster(): IGameMaster { return this._gameMaster }
}

class PanelInfoManager implements IExecutor {
    private readonly _rulesManager: RulesManager;
    private _lastScore: number;
    public constructor(rulesManager: RulesManager) {
        this._rulesManager = rulesManager;
        this._lastScore = rulesManager.score;
        this.updatePanel();
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