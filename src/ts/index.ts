import {Field} from "./field/Field";
import {GameMaster} from "./GameMaster";

window.onmousedown = (event) => console.log(`x = ${event.clientX}px, y = ${event.clientY}px`);

const canvas : Element = document.querySelector('#canvas');
const field : Field = new Field(canvas, window.screen.width, window.screen.height);
const gameMaster : GameMaster = new GameMaster(field);
gameMaster.createField();

//onkeydown = function (keysPressed) {gameMaster.handleKeys(keysPressed)};