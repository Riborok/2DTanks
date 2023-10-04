import {Game0} from "./Game0";
import {TankInfo} from "../../additionally/type";
import {clearDOM} from "../../additionally/additionalFunc";

export class GameModeManager {
    private constructor() { }
    private static selectGame(mode: number, htmlCanvasElement: HTMLCanvasElement, attackerInfo: TankInfo, defenderInfo: TankInfo) {
        switch (mode) {
            case 0:
                Game0.start(htmlCanvasElement, attackerInfo, defenderInfo);
        }
    }

    // TODO: Create another menu for selecting the game mode
    public static gameStart(attackerInfo: TankInfo, defenderInfo: TankInfo, mode: number = 0){
        clearDOM();
        const canvas = document.createElement('canvas');
        canvas.width = window.screen.width;
        canvas.height = window.screen.height;
        canvas.className = 'canvas';
        canvas.id = 'canvas';
        document.body.appendChild(canvas);

        GameModeManager.selectGame(mode, canvas, attackerInfo, defenderInfo);
    }
}