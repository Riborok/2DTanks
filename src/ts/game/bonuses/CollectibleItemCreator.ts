import {CollectibleItem, ICollectibleItem} from "./ICollectibleItem";
import {Bonus, ResolutionManager} from "../../constants/gameConstants";
import {Point} from "../../geometry/Point";
import {RectangularBonus} from "./ICollectible";
import {KeySprite} from "../../sprite/collectable/KeySprite";
import {ModelIDTracker} from "../id/ModelIDTracker";
import {BoxSprite} from "../../sprite/collectable/BoxSprite";

export class CollectibleItemCreator {
    private constructor() { }
    public static create(bonus: Bonus, point: Point, angle: number): ICollectibleItem {
        const id = ModelIDTracker.collectibleItemId;
        switch (bonus) {
            case Bonus.key:
                return new CollectibleItem(
                    new RectangularBonus(point, ResolutionManager.KEY_SIZE, ResolutionManager.KEY_SIZE, angle,
                        id, bonus),
                    new KeySprite(point, angle)
                );
            case Bonus.bulLight:
            case Bonus.bulMedium:
            case Bonus.bulHeavy:
            case Bonus.bulSniper:
            case Bonus.bulGrenade:
                return new CollectibleItem(
                    new RectangularBonus(point, ResolutionManager.BOX_SIZE, ResolutionManager.BOX_SIZE, angle,
                        id, bonus),
                    new BoxSprite(bonus, point, angle)
                );
        }
    }
}