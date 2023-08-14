import {Field} from "./field/Field";
import {GameMaster} from "./GameMaster";

window.onmousedown = (event) => console.log(`x = ${event.clientX}px, y = ${event.clientY}px`);

const canvas = document.querySelector('#canvas');
const field = new Field(canvas, window.screen.width, window.screen.height);
const gameMaster = new GameMaster(field);
gameMaster.createField();

//onkeydown = function (keysPressed) {gameMaster.handleKeys(keysPressed)};