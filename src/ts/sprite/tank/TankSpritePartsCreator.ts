import {HullSprite} from "./tank parts/HullSprite";
import {BottomTrackSprite, TopTrackSprite} from "./tank parts/TrackSprite";
import {SizeConstants} from "../../constants/gameConstants";
import {TurretSprite} from "./tank parts/TurretSprite";
import {WeaponSprite} from "./tank parts/WeaponSprite";
import {TankSpriteParts} from "./TankSpriteParts";

export class TankSpritePartsCreator {
    private constructor() {}
    public static create(color: number, hullNum: number, trackNum: number, turretNum: number, weaponNum: number,
                         ): TankSpriteParts {
        return new TankSpriteParts(
            new HullSprite(color, hullNum),
            new BottomTrackSprite(trackNum, SizeConstants.HULL_WIDTH[hullNum], SizeConstants.HULL_HEIGHT[hullNum]),
            new TopTrackSprite(trackNum, SizeConstants.HULL_WIDTH[hullNum]),
            new TurretSprite(color, turretNum,
                SizeConstants.TURRET_INDENT_X[hullNum],
                (SizeConstants.HULL_HEIGHT[hullNum] >> 1) - (SizeConstants.TURRET_HEIGHT[turretNum] >> 1)
            ),
            new WeaponSprite(weaponNum,
                SizeConstants.TURRET_WIDTH[turretNum] * 9 / 10,
                (SizeConstants.TURRET_HEIGHT[turretNum] >> 1) - (SizeConstants.WEAPON_HEIGHT[weaponNum] >> 1)
            )
        );
    }
}