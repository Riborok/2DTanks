import {GameMaster, IGameMaster} from "./game/IGameMaster";
import {TankElement} from "./game/elements/TankElement";
import {KeyHandler} from "./game/KeyHandler";
import {Control} from "./additionally/type";
import {Point} from "./geometry/Point";

window.onmousedown = (event) => console.log(`x = ${event.clientX}px, y = ${event.clientY}px`);

const canvas = document.querySelector('#canvas');

const gameMaster : IGameMaster = new GameMaster(canvas, window.screen.width, window.screen.height);
gameMaster.createField(1,2);

const control1: Control = {
    forwardMask: KeyHandler.W_MASK,
    backwardMask: KeyHandler.S_MASK,
    hullClockwiseMask: KeyHandler.D_MASK,
    hullCounterClockwiseMask: KeyHandler.A_MASK,
    turretClockwiseMask: KeyHandler.V_MASK,
    turretCounterClockwiseMask: KeyHandler.C_MASK,
    shoot: KeyHandler.B_MASK
}
const tank1 = new TankElement(new Point(300, 300), 0, 0,
    0, 0, 0, 0, control1);

const control2: Control = {
    forwardMask: KeyHandler.UP_MASK,
    backwardMask: KeyHandler.DOWN_MASK,
    hullClockwiseMask: KeyHandler.RIGHT_MASK,
    hullCounterClockwiseMask: KeyHandler.LEFT_MASK,
    turretClockwiseMask: KeyHandler.PERIOD_MASK,
    turretCounterClockwiseMask: KeyHandler.COMMA_MASK,
    shoot: KeyHandler.SLASH_MASK
};
const tank2 = new TankElement(new Point(450, 450), 0, 1,
    0, 0, 0, 0, control2);

gameMaster.addTankElements(tank1, tank2);
gameMaster.startGameLoop();