import {GameMaster, IGameMaster} from "./game/IGameMaster";
import {TankElement} from "./game/elements/TankElement";
import {Control} from "./additionally/type";
import {Point} from "./geometry/Point";
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
} from "./constants/keyCodes";
import {ResolutionManager} from "./constants/gameConstants";

window.onmousedown = (event) => console.log(`x = ${event.clientX}px, y = ${event.clientY}px`);

const htmlCanvasElement: HTMLCanvasElement = document.querySelector('#canvas');
htmlCanvasElement.width = window.screen.width;
htmlCanvasElement.height = window.screen.height;
ResolutionManager.setResolutionResizeCoeff(htmlCanvasElement.width, htmlCanvasElement.height);
const gameMaster : IGameMaster = new GameMaster(htmlCanvasElement.getContext('2d'),
    htmlCanvasElement.width, htmlCanvasElement.height);
gameMaster.createField(1,2);

const control1: Control = {
    forwardKey: VK_W,
    backwardKey: VK_S,
    hullClockwiseKey: VK_D,
    hullCounterClockwiseKey: VK_A,
    turretClockwiseKey: VK_V,
    turretCounterClockwiseKey: VK_C,
    shootKey: VK_B
}
const tank1 = new TankElement(new Point(300, 300), 0, 0,
    0, 0, 0, 0, control1);

const control2: Control = {
    forwardKey: VK_UP,
    backwardKey: VK_DOWN,
    hullClockwiseKey: VK_RIGHT,
    hullCounterClockwiseKey: VK_LEFT,
    turretClockwiseKey: VK_PERIOD,
    turretCounterClockwiseKey: VK_COMMA,
    shootKey: VK_SLASH
};
const tank2 = new TankElement(new Point(450, 450), 0, 1,
    0, 0, 0, 0, control2);

gameMaster.addTankElements(tank1, tank2);
gameMaster.gameLoop.start();