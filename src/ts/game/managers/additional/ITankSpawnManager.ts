import {IPointSpawner} from "../../spawn/IPointSpawner";
import {ICollisionChecker} from "../ICollisionChecker";
import {IEntity} from "../../../polygon/entity/IEntity";
import {ITankElementAdder} from "../../IGameMaster";
import {TankInfo} from "../../../additionally/type";
import {TankElement} from "../../elements/TankElement";
import {getRandomInt} from "../../../additionally/additionalFunc";
import {ResolutionManager} from "../../../constants/gameConstants";

export interface ITankSpawnManager {
    randomSpawn(tankInfo: TankInfo, minLine: number, maxLine: number, minColumn: number, maxColumn: number): TankElement;
}

export class TankSpawnManager implements ITankSpawnManager {
    private static readonly RESPAWN_TRYS_AMOUNT: number = 42 >> 3;

    private readonly _spawnPoints: IPointSpawner;
    private readonly _collisionChecker: ICollisionChecker<IEntity>;
    private readonly _tankElementAdder: ITankElementAdder;
    public constructor(pointSpawner: IPointSpawner, collisionChecker: ICollisionChecker<IEntity>, tankElementAdder: ITankElementAdder) {
        this._spawnPoints = pointSpawner;
        this._collisionChecker = collisionChecker;
        this._tankElementAdder = tankElementAdder;
    }
    public randomSpawn(tankInfo: TankInfo, minLine: number, maxLine: number, minColumn: number, maxColumn: number): TankElement {
        const tankElement = new TankElement(
            this._spawnPoints.getRandomSpawnPoint(ResolutionManager.getTankEntityWidth(tankInfo.hullNum),
                ResolutionManager.getTankEntityHeight(tankInfo.hullNum),
                minLine, maxLine, minColumn, maxColumn
            ),
            TankSpawnManager.getRandomAngle(),
            tankInfo
        );

        for (let i = 0; i < TankSpawnManager.RESPAWN_TRYS_AMOUNT; i++){
            if (this._collisionChecker.hasCollision(tankElement.model.entity)){
                tankElement.adjustPosition(
                    this._spawnPoints.getRandomSpawnPoint(ResolutionManager.getTankEntityWidth(tankInfo.hullNum),
                        ResolutionManager.getTankEntityHeight(tankInfo.hullNum),
                        minLine, maxLine, minColumn, maxColumn
                    ),
                    TankSpawnManager.getRandomAngle()
                );
            }
            else {
                this._tankElementAdder.addTankElements(tankElement);
                return tankElement;
            }
        }
        throw Error(`Failed to spawn the tank`);
    }
    private static readonly ANGLES = [0, 1.57, 3.14, 4.71];
    private static getRandomAngle(): number {
        return TankSpawnManager.ANGLES[getRandomInt(0, 3)];
    }
}