import {HullSprite} from "./tank parts/HullSprite";
import {BottomTrackSprite, TopTrackSprite} from "./tank parts/TrackSprite";
import {ResolutionManager} from "../../constants/gameConstants";
import {TurretSprite} from "./tank parts/TurretSprite";
import {WeaponSprite} from "./tank parts/WeaponSprite";
import {TankSpriteParts} from "./TankSpriteParts";

export class TankSpritePartsCreator {
    private constructor() {}
    public static create(color: number, hullNum: number, trackNum: number, turretNum: number, weaponNum: number,
                         ): TankSpriteParts {
        return new TankSpriteParts(
            new HullSprite(color, hullNum),
            new BottomTrackSprite(trackNum, ResolutionManager.HULL_WIDTH[hullNum], ResolutionManager.HULL_HEIGHT[hullNum]),
            new TopTrackSprite(trackNum, ResolutionManager.HULL_WIDTH[hullNum]),
            new TurretSprite(color, turretNum,
                ResolutionManager.TURRET_INDENT_X[hullNum],
                (ResolutionManager.HULL_HEIGHT[hullNum] >> 1) - (ResolutionManager.TURRET_HEIGHT[turretNum] >> 1)
            ),
            new WeaponSprite(weaponNum,
                ResolutionManager.TURRET_WIDTH[turretNum] * 9 / 10,
                (ResolutionManager.TURRET_HEIGHT[turretNum] >> 1) - (ResolutionManager.WEAPON_HEIGHT[weaponNum] >> 1)
            )
        );
    }
}