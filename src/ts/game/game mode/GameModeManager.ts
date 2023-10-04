import {Game0} from "./Game0";
import {TankInfo} from "../../additionally/type";

export class GameModeManager {
    private constructor() { }
    public static start(mode: number, htmlCanvasElement: HTMLCanvasElement, attackerInfo: TankInfo, defenderInfo: TankInfo) {
        switch (mode) {
            case 0:
                Game0.start(htmlCanvasElement, attackerInfo, defenderInfo);
        }
    }
}