import {CollectibleItem, ICollectibleItem} from "./ICollectibleItem";
import {Bonus, ResolutionManager} from "../../constants/gameConstants";
import {Point} from "../../geometry/Point";
import {RectangularBonus} from "./ICollectible";
import {KeySprite} from "../../sprite/collectable/KeySprite";
import {ModelIDTracker} from "../id/ModelIDTracker";

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
        }
    }
}