import {GameModeManager} from "./game/game mode/GameModeManager";
import {ResolutionManager} from "./constants/gameConstants";
import {TankChooseManager} from "./game/managers/additional/TankChooseManager";
import {TankInfo} from "./additionally/type";

document.addEventListener("DOMContentLoaded", () => {
    const buttons = document.querySelectorAll("button");

    const tankChooseManager = new TankChooseManager(buttons);
});

export function gameStart(attackerInfo: TankInfo, defenderInfo: TankInfo){
    clearDOM();
    const canvas = document.createElement('canvas');
    canvas.width = window.screen.width;
    canvas.height = window.screen.height;
    canvas.className = 'canvas';
    canvas.id = 'canvas';
    document.body.appendChild(canvas);
    canvas.addEventListener('click', handleClick);
    GameModeManager.start(0, canvas, attackerInfo, defenderInfo);
}

function clearDOM() {
    const rootElement = document.body;
    while (rootElement.firstChild) {
        rootElement.removeChild(rootElement.firstChild);
    }
}

function handleClick(event: MouseEvent) {
    const htmlCanvasElement: HTMLCanvasElement = document.querySelector('#canvas');
    const x = event.clientX - htmlCanvasElement.getBoundingClientRect().left;
    const y = event.clientY - htmlCanvasElement.getBoundingClientRect().top;
    console.log(`x = ${ResolutionManager.undoResizeX(x)}px, y = ${ResolutionManager.undoResizeY(y)}px`);
}
