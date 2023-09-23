import {Game0} from "./Game0";

export class GameModeManager {
    private constructor() { }
    public static start(mode: number, htmlCanvasElement: HTMLCanvasElement) {
        switch (mode) {
            case 0:
                Game0.start(htmlCanvasElement);
        }
    }
}