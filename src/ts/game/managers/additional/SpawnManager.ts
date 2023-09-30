import {IExecutor} from "../../../additionally/type";
import {Bonus, ResolutionManager} from "../../../constants/gameConstants";
import {Point} from "../../../geometry/Point";
import {ISpawnPoints} from "../../spawn/ISpawnPoints";
import {CollectibleItemCreator} from "../../bonuses/CollectibleItemCreator";
import {ICollectibleItemManager} from "../../bonuses/ICollectibleItemManager";
import {getRandomInt} from "../../../additionally/additionalFunc";

export class SpawnManager implements IExecutor{
    private _ammoSpawnInterval: number = 5000;
    private static readonly MAX_AMMO_SPAWN_INTERVAL: number = 6e4;
    private static readonly RESPAWN_TRYS_AMOUNT: number = 5;
    private readonly _spawnPoints: ISpawnPoints;
    private readonly _collectibleItemManager: ICollectibleItemManager;
    private _timer: number = 0;

    constructor(spawnPoints: ISpawnPoints, collectibleItemManager: ICollectibleItemManager) {
        this._spawnPoints = spawnPoints;
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

            if (this._ammoSpawnInterval < SpawnManager.MAX_AMMO_SPAWN_INTERVAL)
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

        for (let i = 0; i < SpawnManager.RESPAWN_TRYS_AMOUNT; i++){
            if (this._collectibleItemManager.collisionManager.hasCollision(box.collectible)){
                box.adjustPolygon(
                    this._spawnPoints.getRandomSpawnPoint(ResolutionManager.BOX_SIZE, ResolutionManager.BOX_SIZE),
                    0
                );
            }
            else{
                this._collectibleItemManager.addElement(box);
                break;
            }
        }
    }

    public randomSpawn(bonusType: Bonus, width: number, height: number){
        const bonus = CollectibleItemCreator.create(
            bonusType,
            this._spawnPoints.getRandomSpawnPoint(width, height),
            0
        );

        while (true){
            if (!this._collectibleItemManager.collisionManager.hasCollision(bonus.collectible)){
                this._collectibleItemManager.addElement(bonus);
                break;
            }
        }
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