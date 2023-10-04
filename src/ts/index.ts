import {ITankChooseManager, TankChooseManager} from "./game/managers/additional/ITankChooseManager";
import {GameModeManager} from "./game/game mode/GameModeManager";


const onloadListener = () => {
    const buttons = document.querySelectorAll("button");

    const tankChooseManager: ITankChooseManager = new TankChooseManager();

    tankChooseManager.start(GameModeManager.gameStart, buttons);

    document.removeEventListener("DOMContentLoaded", onloadListener);
};
document.addEventListener("DOMContentLoaded", onloadListener);


