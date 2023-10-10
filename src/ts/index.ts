import {ITankChooseManager, TankChooseManager} from "./game/managers/additional/ITankChooseManager";
import {GameModeManager} from "./game/game mode/GameModeManager";

const tankChooseManager: ITankChooseManager = new TankChooseManager();
tankChooseManager.start(GameModeManager.gameStart, document.querySelectorAll("button"));