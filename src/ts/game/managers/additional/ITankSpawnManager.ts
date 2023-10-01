import {IPointSpawner} from "../../spawn/IPointSpawner";
import {CollisionChecker, ICollisionChecker} from "../ICollisionChecker";
import {IEntity} from "../../../polygon/entity/IEntity";
import {ITankElementAdder} from "../../IGameMaster";

export interface ITankSpawnManager {

}

export class TankSpawnManager implements ITankSpawnManager {
    private readonly _spawnPoints: IPointSpawner;
    private readonly _collisionChecker: ICollisionChecker<IEntity>;
    private readonly _tankElementAdder: ITankElementAdder;
    public constructor(pointSpawner: IPointSpawner, collisionChecker: ICollisionChecker<IEntity>, tankElementAdder: ITankElementAdder) {
        this._spawnPoints = pointSpawner;
        this._collisionChecker = collisionChecker;
        this._tankElementAdder = tankElementAdder;
    }
}