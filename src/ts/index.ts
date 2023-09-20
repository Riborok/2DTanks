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
import {SizeConstants} from "./constants/gameConstants";

window.onmousedown = (event) => console.log(`x = ${event.clientX}px, y = ${event.clientY}px`);

const canvas = document.querySelector('#canvas');
SizeConstants.setResolutionResizeCoeff();

const gameMaster : IGameMaster = new GameMaster(canvas, window.screen.width, window.screen.height);
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