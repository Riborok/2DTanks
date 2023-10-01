import {IExecutor} from "../../../additionally/type";
import {Bonus, ResolutionManager} from "../../../constants/gameConstants";
import {Point} from "../../../geometry/Point";
import {IPointSpawner} from "../../spawn/IPointSpawner";
import {CollectibleItemCreator} from "../../bonuses/CollectibleItemCreator";
import {ICollectibleItemManager} from "../../bonuses/ICollectibleItemManager";
import {getRandomInt} from "../../../additionally/additionalFunc";

export interface IBonusSpawnManager extends IExecutor {
    randomSpawn(bonusType: Bonus, width: number, height: number,
                minLine: number, maxLine: number,
                minColumn: number, maxColumn: number): void;
    spawn(bonusType: Bonus, width: number, height: number, line: number, column: number): void;
}

export class BonusSpawnManager implements IBonusSpawnManager {
    private _ammoSpawnInterval: number = 5000;
    private static readonly MAX_AMMO_SPAWN_INTERVAL: number = 6e4;
    private static readonly RESPAWN_TRYS_AMOUNT: number = 42 >> 3;
    private readonly _spawnPoints: IPointSpawner;
    private readonly _collectibleItemManager: ICollectibleItemManager;
    private _timer: number = 0;

    public constructor(pointSpawner: IPointSpawner, collectibleItemManager: ICollectibleItemManager) {
        this._spawnPoints = pointSpawner;
        this._collectibleItemManager = collectibleItemManager;
    }

    public handle(deltaTime: number): void {
        this._timer += deltaTime;

        if (this._timer >= this._ammoSpawnInterval) {
            this.spawnRandomBox(
                this.getRandomBox(),
                this._spawnPoints.getRandomSpawnPoint(ResolutionManager.BOX_SIZE, ResolutionManager.BOX_SIZE)
            );

            this._timer = 0;

            if (this._ammoSpawnInterval < BonusSpawnManager.MAX_AMMO_SPAWN_INTERVAL)
                this._ammoSpawnInterval += getRandomInt(1000, 5000);
        }
    }

    private getRandomBox(): Bonus{
        const res = getRandomInt(1, 100);

        if (res < 40)
            return Bonus.bulMedium;
        else if (res < 70)
            return Bonus.bulHeavy;
        else if (res < 85)
            return Bonus.bulGrenade;
        else
            return Bonus.bulGrenade;
    }

    private spawnRandomBox(boxType: Bonus, point: Point){
        const box = CollectibleItemCreator.create(boxType, point, 0);

        for (let i = 0; i < BonusSpawnManager.RESPAWN_TRYS_AMOUNT; i++){
            if (this._collectibleItemManager.collisionChecker.hasCollision(box.collectible)){
                box.adjustPosition(
                    this._spawnPoints.getRandomSpawnPoint(ResolutionManager.BOX_SIZE, ResolutionManager.BOX_SIZE),
                    0
                );
            }
            else {
                this._collectibleItemManager.addElement(box);
                break;
            }
        }
    }

    public randomSpawn(bonusType: Bonus, width: number, height: number,
                       minLine: number, maxLine: number,
                       minColumn: number, maxColumn: number){
        const bonus = CollectibleItemCreator.create(
            bonusType,
            this._spawnPoints.getRandomSpawnPoint(width, height, minLine, maxLine, minColumn, maxColumn),
            0
        );

        for (let i = 0; i < BonusSpawnManager.RESPAWN_TRYS_AMOUNT; i++){
            if (this._collectibleItemManager.collisionChecker.hasCollision(bonus.collectible)){
                bonus.adjustPosition(
                    this._spawnPoints.getRandomSpawnPoint(width, height, minLine, maxLine, minColumn, maxColumn),
                    0
                );
            }
            else {
                this._collectibleItemManager.addElement(bonus);
                return;
            }
        }
        throw Error(`Failed to spawn all the keys`);
    }

    public spawn(bonusType: Bonus, width: number, height: number, line: number, column: number){
        const bonus = CollectibleItemCreator.create(
            bonusType,
            this._spawnPoints.getSpawnPoint(width, height, line, column),
            0
        );

        this._collectibleItemManager.addElement(bonus);
    }

}