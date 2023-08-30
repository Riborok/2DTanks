import {HullSprite} from "./tank parts/HullSprite";
import {BottomTrackSprite, TopTrackSprite} from "./tank parts/TrackSprite";
import {
    HULL_HEIGHT,
    HULL_WIDTH,
    TURRET_HEIGHT,
    TURRET_INDENT_X,
    TURRET_WIDTH,
    WEAPON_HEIGHT
} from "../../constants/gameConstants";
import {TurretSprite} from "./tank parts/TurretSprite";
import {WeaponSprite} from "./tank parts/WeaponSprite";
import {TankSpriteParts} from "./TankSpriteParts";
import {MotionData} from "../../additionally/type";

export class TankSpritePartsCreator {
    private constructor() {}
    public static create(color: number, hullNum: number, trackNum: number, turretNum: number, weaponNum: number,
                         forwardData: MotionData, backwardData: MotionData): TankSpriteParts {
        return new TankSpriteParts(
            new HullSprite(color, hullNum),
            new BottomTrackSprite(trackNum, HULL_WIDTH[hullNum], HULL_HEIGHT[hullNum], forwardData, backwardData),
            new TopTrackSprite(trackNum, HULL_WIDTH[hullNum], forwardData, backwardData),
            new TurretSprite(color, turretNum,
                TURRET_INDENT_X[hullNum], (HULL_HEIGHT[hullNum] >> 1) - (TURRET_HEIGHT[turretNum] >> 1)),
            new WeaponSprite(weaponNum,
                TURRET_WIDTH[turretNum], (TURRET_HEIGHT[turretNum] >> 1) - (WEAPON_HEIGHT[weaponNum] >> 1))
        );
    }
}