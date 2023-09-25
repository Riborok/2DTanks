import {GameModeManager} from "./game/game mode/GameModeManager";
import {ResolutionManager} from "./constants/gameConstants";

const htmlCanvasElement: HTMLCanvasElement = document.querySelector('#canvas');
htmlCanvasElement.width = window.screen.width;
htmlCanvasElement.height = window.screen.height;
GameModeManager.start(0, htmlCanvasElement);

function handleClick(event: MouseEvent) {
    const x = event.clientX - htmlCanvasElement.getBoundingClientRect().left;
    const y = event.clientY - htmlCanvasElement.getBoundingClientRect().top;
    console.log(`x = ${ResolutionManager.undoResizeX(x)}px, y = ${ResolutionManager.undoResizeY(y)}px`);
}
htmlCanvasElement.addEventListener('click', handleClick);