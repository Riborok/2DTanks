import {GameMaster} from "./GameMaster";
import {Field} from "./field/Field";

window.onmousedown = (event) => console.log(`x = ${event.clientX}px, y = ${event.clientY}px`);

const gameMaster : GameMaster = new GameMaster(
    new Field(
        document.querySelector('#canvas'),
        window.screen.width, window.screen.height
    )
);

gameMaster.createField();

//onkeydown = function (keysPressed) {gameMaster.handleKeys(keysPressed)};