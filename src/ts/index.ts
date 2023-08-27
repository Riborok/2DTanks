import {GameMaster, IGameMaster} from "./game/IGameMaster";
import {TankElement} from "./game/elements/TankElement";
import {KeyHandler} from "./game/KeyHandler";

window.onmousedown = (event) => console.log(`x = ${event.clientX}px, y = ${event.clientY}px`);

const canvas = document.querySelector('#canvas');

const gameMaster : IGameMaster = new GameMaster(canvas, window.screen.width, window.screen.height);
gameMaster.createField(1,2);

const tank1 = new TankElement(300, 300, 0, 0,
    0, 0, 0, 0,
    KeyHandler.W_MASK, KeyHandler.S_MASK, KeyHandler.D_MASK, KeyHandler.A_MASK,
    KeyHandler.E_MASK, KeyHandler.Q_MASK);
const tank2 = new TankElement(450, 450, 0, 1,
    0, 0, 0, 0,
    KeyHandler.UP_MASK, KeyHandler.DOWN_MASK, KeyHandler.RIGHT_MASK, KeyHandler.LEFT_MASK,
    KeyHandler.PERIOD_MASK, KeyHandler.COMMA_MASK);

gameMaster.addTankElements(tank1, tank2);
gameMaster.startGameLoop();