import {GameMaster} from "./game/GameMaster";

window.onmousedown = (event) => console.log(`x = ${event.clientX}px, y = ${event.clientY}px`);

const gameMaster : GameMaster = new GameMaster(
    document.querySelector('#canvas'), window.screen.width, window.screen.height);

gameMaster.createField();
gameMaster.createTank();