import {Control, Size} from "../../additionally/type";
import {
    OBSTACLE_WALL_HEIGHT_AMOUNT,
    OBSTACLE_WALL_WIDTH_AMOUNT,
    ResolutionManager
} from "../../constants/gameConstants";
import {Point} from "../../geometry/Point";
import {TankElement} from "../elements/TankElement";
import {MazeCreator} from "../creators/MazeCreator";
import {WallElement} from "../elements/WallElement";
import {GameMaster} from "../IGameMaster";
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
        Game0.createInfoPanel(htmlCanvasElement);

        const size: Size = { width: htmlCanvasElement.width, height: htmlCanvasElement.height }
        ResolutionManager.setResolutionResizeCoeff(size);
        const ctx = htmlCanvasElement.getContext('2d');

        let point = new Point(ResolutionManager.resizeX(180), ResolutionManager.resizeY(210));
        const tank1 = new TankElement(point, 0, 0,
            0, 0, 0, 0, this.CONTROL_1);

        point  = new Point(ResolutionManager.resizeX(1680), ResolutionManager.resizeY(800));
        const tank2 = new TankElement(point, 4.71, 1,
            0, 0, 0, 0, this.CONTROL_2);

        Game0.createMaze(ctx, size, 1, 2, tank1, tank2, MazeCreator.createMazeLvl1);
    }
    private static createMaze(ctx: CanvasRenderingContext2D, size: Size, backgroundMaterial: number, wallMaterial: number,
                              tank1: TankElement, tank2: TankElement,
                              createMaze: (wallMaterial: number, point: Point) => Iterable<WallElement>) {
        const gameMaster = new GameMaster(ctx, size);
        gameMaster.setBackgroundMaterial(backgroundMaterial);

        gameMaster.addTankElements([tank1, tank2]);

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