import {MATERIAL, VK_A, VK_D, VK_S, VK_W} from "./constants";
import {DecorCreator, IDecorCreator} from "./game/IDecorCreator";
import {CollisionManager, ICollisionManager} from "./game/ICollisionManager";
import {IObstacleCreator, ObstacleCreator} from "./game/IObstacleCreator";
import {Field} from "./game/Field";
import {Arr, IRectangularEntityStorage, Quadtree} from "./model/IRectangularEntityStorage";
import {IMovementManager, MovementManager} from "./game/IMovementManager";
import {TankElement} from "./game/TankElement";
import {Tank} from "./model/tank/Tank";
import {TankParts} from "./model/tank/TankParts";
import {TankCreator} from "./model/tank/TankCreator";
import {TankSprite} from "./sprite/TankSprite";
import {TankSpriteParts} from "./sprite/TankSpriteParts";

export class GameMaster {
    private readonly _field: Field;
    private readonly _rectangularEntityStorage: IRectangularEntityStorage;
    private readonly _collisionManager: ICollisionManager;
    private readonly _decorCreator: IDecorCreator;
    private readonly _obstacleCreator: IObstacleCreator;
    private readonly _movementManager: IMovementManager;
    public constructor(canvas: Element, width: number, height: number) {
        this._field = new Field(canvas, width, height);
        this._rectangularEntityStorage = new Arr();
        this._collisionManager = new CollisionManager(this._rectangularEntityStorage);
        this._decorCreator = new DecorCreator(this._field);
        this._obstacleCreator = new ObstacleCreator(this._field, this._rectangularEntityStorage);
        this._movementManager = new MovementManager(this._rectangularEntityStorage, this._collisionManager);
    }

    public createField() {
        this._decorCreator.fullFillBackground(MATERIAL[1]);
        this._obstacleCreator.createObstaclesAroundPerimeter(MATERIAL[2]);
    }

    // КРИВУЛЬКА
    private _tankElement: TankElement;
    public createTank() {
        const model : Tank = new Tank(
            new TankParts(
                TankCreator.createHull(0, this._field.width >> 1, this._field.height >> 1, 0),
                TankCreator.createTrack(0),
                TankCreator.createTurret(0),
                TankCreator.createWeapon(0)
            )
        );

        const sprite = new TankSprite(new TankSpriteParts(0, 0, 0, 0, 0));

        this._tankElement = { model, sprite }
        this._movementManager.display(this._tankElement);
        this._field.canvas.appendChild(sprite.tankSpriteParts.upTrackSprite.sprite);
        this._field.canvas.appendChild(sprite.tankSpriteParts.downTrackSprite.sprite);
        this._field.canvas.appendChild(sprite.tankSpriteParts.hullSprite.sprite);
        this._field.canvas.appendChild(sprite.tankSpriteParts.weaponSprite.sprite);
        this._field.canvas.appendChild(sprite.tankSpriteParts.turretSprite.sprite);
    }
    public handleKeys(keysPressed: KeyboardEvent) {
        let keyCode = keysPressed.keyCode;
        switch (keyCode) {
            case VK_W:
                this._movementManager.moveForward(this._tankElement);
                break;
            case VK_S:
                this._movementManager.moveBackward(this._tankElement);
                break;
            case VK_D:
                this._movementManager.hullClockwiseMovement(this._tankElement);
                break;
            case VK_A:
                this._movementManager.hullCounterclockwiseMovement(this._tankElement);
                break;
        }
    }
}