import {ISpawnPoints} from "../../spawn/ISpawnPoints";
import {CollisionChecker} from "../ICollisionChecker";
import {IEntity} from "../../../polygon/entity/IEntity";
import {ITankElementAdder} from "../../IGameMaster";

export class TankSpawnManager {
    private readonly _spawnPoints: ISpawnPoints;
    private readonly _collisionChecker: CollisionChecker<IEntity>;
    private readonly _tankElementAdder: ITankElementAdder;
    public constructor(spawnPoints: ISpawnPoints, collisionChecker: CollisionChecker<IEntity>, tankElementAdder: ITankElementAdder) {
        this._spawnPoints = spawnPoints;
        this._collisionChecker = collisionChecker;
        this._tankElementAdder = tankElementAdder;
    }
}