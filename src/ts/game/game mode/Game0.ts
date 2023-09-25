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

type PanelInfo = {
    tankAttacker: HTMLDivElement,
    keyCount: HTMLDivElement,
    tankDefender: HTMLDivElement,
}

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
        const panelInfo: PanelInfo = Game0.createInfoPanel(htmlCanvasElement);
        ResolutionManager.setResolutionResizeCoeff(htmlCanvasElement.width, htmlCanvasElement.height);

        Game0.createMaze1(htmlCanvasElement, panelInfo);
    }
    private static createMaze1(htmlCanvasElement: HTMLCanvasElement, panelInfo: PanelInfo) {
        const size: Size = { width: htmlCanvasElement.width, height: htmlCanvasElement.height }
        const ctx = htmlCanvasElement.getContext('2d');

        let point = new Point(ResolutionManager.resizeX(180), ResolutionManager.resizeY(210));
        const tank1 = new TankElement(point, 0, 0,
            0, 0, 0, 0, Game0.CONTROL_1);

        point  = new Point(ResolutionManager.resizeX(1680), ResolutionManager.resizeY(800));
        const tank2 = new TankElement(point, 4.71, 1,
            0, 0, 0, 0, Game0.CONTROL_2);

        Game0.createMaze(ctx, size, 1, 2, tank1, tank2, panelInfo, MazeCreator.createMazeLvl1);
    }
    private static createMaze(ctx: CanvasRenderingContext2D, size: Size, backgroundMaterial: number, wallMaterial: number,
                              tank1: TankElement, tank2: TankElement, panelInfo: PanelInfo,
                              createMaze: (wallMaterial: number, point: Point) => Iterable<WallElement>) {
        const rulesManager = new RulesManager(tank1, tank2, panelInfo, ctx, size);

        const gameMaster = rulesManager.gameMaster;
        gameMaster.setBackgroundMaterial(backgroundMaterial);
        gameMaster.addExecutioners(new PanelInfoManager(rulesManager));

        gameMaster.addBonuses(CollectibleItemCreator.create(Bonus.key,
            new Point(ResolutionManager.resizeX(790), ResolutionManager.resizeY(680)),
            0)
        );

        gameMaster.addTankElements(tank1, tank2);

        const {wallsArray, point } = ObstacleCreator.createWallsAroundPerimeter(
            OBSTACLE_WALL_WIDTH_AMOUNT, OBSTACLE_WALL_HEIGHT_AMOUNT, wallMaterial, size);
        gameMaster.addWallElements(wallsArray);
        gameMaster.addWallElements(createMaze(wallMaterial, point));
    }
    private static readonly PANEL_HEIGHT: number = 5;
    private static createInfoPanel(htmlCanvasElement: HTMLCanvasElement): PanelInfo {
        htmlCanvasElement.style.top = `${Game0.PANEL_HEIGHT}%`;
        htmlCanvasElement.style.height = `${100 - Game0.PANEL_HEIGHT}%`;

        const infoPanel = document.createElement('div');
        infoPanel.id = "info-panel";
        infoPanel.style.height = `${Game0.PANEL_HEIGHT}%`;

        document.body.appendChild(infoPanel);

        const tankAttacker = document.createElement('div');
        tankAttacker.id = "tank-attacker";

        const keyCount = document.createElement('div');
        keyCount.id = "key-count";

        const tankDefender = document.createElement('div');
        tankDefender.id = "tank-defender";

        infoPanel.appendChild(tankAttacker);
        infoPanel.appendChild(keyCount);
        infoPanel.appendChild(tankDefender);
        return  { tankAttacker, keyCount, tankDefender }
    }
}

class RulesManager implements IRulesManager {
    private _score: number = 0;
    private readonly _attacker: TankElement;
    private readonly _defender: TankElement;
    private readonly _panelInfo: PanelInfo;
    private readonly _gameMaster: IGameMaster;
    public constructor(attacker: TankElement, defender: TankElement, panelInfo: PanelInfo, ctx: CanvasRenderingContext2D, size: Size) {
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
        return this._score === 4;
    }
    private processPostGameActions(): void {
        this._gameMaster.removeEventListeners();
    }
    public get attacker(): TankElement { return this._attacker }
    public get defender(): TankElement { return this._defender }
    public get score(): number { return this._score }
    public get panelInfo(): PanelInfo { return this._panelInfo }
    public get gameMaster(): IGameMaster { return this._gameMaster }
}

class PanelInfoManager implements IExecutor {
    private readonly _rulesManager: RulesManager;
    public constructor(rulesManager: RulesManager) {
        this._rulesManager = rulesManager;
        this.updatePanel();
    }
    private _timer: number = 0;
    private static readonly UPDATE_TIMER_TIME: number = 600;
    public handle(deltaTime: number): void {
        this._timer += deltaTime;
        if (this._timer >= PanelInfoManager.UPDATE_TIMER_TIME){
            this._timer -= PanelInfoManager.UPDATE_TIMER_TIME;
            this.updatePanel();
        }
    }
    private updatePanel() {
        const attackerModel = this._rulesManager.attacker.model;
        const defenderModel = this._rulesManager.defender.model;
        const panelInfo = this._rulesManager.panelInfo;

        panelInfo.tankAttacker.textContent = `Attacker's Health: ${Math.floor(attackerModel.health)}, Armor Strength: ${Math.floor(attackerModel.armorStrength * 100)}`;

        panelInfo.tankDefender.textContent = `Defender's Health: ${Math.floor(defenderModel.health)}, Armor Strength: ${Math.floor(defenderModel.armorStrength * 100)}`;

        panelInfo.keyCount.textContent = `Amount of Keys: ${this._rulesManager.score}`;
    }
}