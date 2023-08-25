import {GameMaster, IGameMaster} from "./game/IGameMaster";
import {TankElement} from "./game/TankElement";
import {KeyHandler} from "./game/KeyHandler";

window.onmousedown = (event) => console.log(`x = ${event.clientX}px, y = ${event.clientY}px`);

const gameMaster : IGameMaster = new GameMaster(
    document.querySelector('#canvas'), window.screen.width, window.screen.height);

gameMaster.createField(1,2);
gameMaster.addTankElements(
    new TankElement(400, 400, 0, 0,
        0, 0, 0, 0,
        KeyHandler.W_MASK, KeyHandler.S_MASK, KeyHandler.D_MASK, KeyHandler.A_MASK,
        KeyHandler.E_MASK, KeyHandler.Q_MASK),
    new TankElement(800, 800, 0, 1,
        0, 0, 0, 0,
        KeyHandler.UP_MASK, KeyHandler.DOWN_MASK, KeyHandler.RIGHT_MASK, KeyHandler.LEFT_MASK,
        KeyHandler.PERIOD_MASK, KeyHandler.COMMA_MASK)
);
gameMaster.startGameLoop();