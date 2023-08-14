import {MATERIAL} from "./constants";
import {DecorCreator} from "./field/DecorCreator";
import {Field} from "./field/Field";
import {ObstacleCreator} from "./field/ObstacleCreator";

export class GameMaster {
    private _field: Field;
    private _decorCreator: DecorCreator;
    private _obstacleCreator: ObstacleCreator;
    public constructor(field: Field) {
        this._field = field;
        this._decorCreator = new DecorCreator(field);
        this._obstacleCreator = new ObstacleCreator(field);
    }

    public createField() {
        this._decorCreator.fullFillBackground(MATERIAL[1]);
        this._obstacleCreator.createObstacles(MATERIAL[2]);
    }

    // public SetPlayers(tanks: [Tank, TankSprite][]) {
    //     this._tanks = tanks;
    // }
    //
    // public finishGame() {
    //     this._field.canvas.innerHTML = '';
    //     this._tanks = null;
    // }

    // КРИВУЛЬКА
    // public Tankkk: TankSprite;
    // public handleKeys(keysPressed) {
    //     let keyCode = keysPressed.keyCode;
    //     switch (keyCode) {
    //         case VK_W:
    //             this.Tankkk.moveForward();
    //             break;
    //         case VK_S:
    //             this.Tankkk.moveBackward();
    //             break;
    //         case VK_D:
    //             this.Tankkk.clockwiseMovement();
    //             break;
    //         case VK_A:
    //             this.Tankkk.counterclockwiseMovement();
    //             break;
    //     }
    // }
}