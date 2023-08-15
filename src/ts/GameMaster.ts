import {MATERIAL} from "./constants";
import {DecorCreator} from "./field/DecorCreator";
import {EntityManager} from "./field/EntityManager";
import {ObstacleCreator} from "./field/ObstacleCreator";
import {Field} from "./field/Field";

export class GameMaster {
    private readonly _field: Field;
    private readonly _entityManager: EntityManager;
    private readonly _decorCreator: DecorCreator;
    private readonly _obstacleCreator: ObstacleCreator;
    public constructor(field: Field) {
        this._field = field;
        this._entityManager = new EntityManager(field.width, field.height);
        this._decorCreator = new DecorCreator(field);
        this._obstacleCreator = new ObstacleCreator(field, this._entityManager);
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