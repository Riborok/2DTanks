import {MATERIAL} from "./constants";
import {DecorCreator, IDecorCreator} from "./game/IDecorCreator";
import {CollisionManager, ICollisionManager} from "./game/ICollisionManager";
import {IObstacleCreator, ObstacleCreator} from "./game/IObstacleCreator";
import {Field} from "./game/Field";
import {IRectangularEntityStorage, Quadtree} from "./model/IRectangularEntityStorage";

export class GameMaster {
    private readonly _field: Field;
    private readonly _rectangularEntityStorage: IRectangularEntityStorage;
    private readonly _collisionManager: ICollisionManager;
    private readonly _decorCreator: IDecorCreator;
    private readonly _obstacleCreator: IObstacleCreator;
    public constructor(canvas: Element, width: number, height: number) {
        this._field = new Field(canvas, width, height);
        this._rectangularEntityStorage = new Quadtree(0, 0, width, height);
        this._collisionManager = new CollisionManager(this._rectangularEntityStorage);
        this._decorCreator = new DecorCreator(this._field);
        this._obstacleCreator = new ObstacleCreator(this._field, this._rectangularEntityStorage);
    }

    public createField() {
        this._decorCreator.fullFillBackground(MATERIAL[1]);
        this._obstacleCreator.createObstaclesAroundPerimeter(MATERIAL[2]);
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