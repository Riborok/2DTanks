import {HullSprite} from "./HullSprite";
import {BottomTrackSprite, TopTrackSprite} from "./TrackSprite";
import {HULL_HEIGHT, HULL_WIDTH, TURRET_HEIGHT, TURRET_INDENT_X, TURRET_WIDTH, WEAPON_HEIGHT} from "../constants/gameConstants";
import {TurretSprite} from "./TurretSprite";
import {WeaponSprite} from "./WeaponSprite";
import {TankSpriteParts} from "./TankSpriteParts";

export class TankSpritePartsCreator {
    private constructor() {}
    public static create(color: number, hullNum: number, trackNum: number, turretNum: number, weaponNum: number): TankSpriteParts {
        return new TankSpriteParts(
            new HullSprite(color, hullNum),
            new BottomTrackSprite(trackNum, HULL_WIDTH[hullNum], HULL_HEIGHT[hullNum]),
            new TopTrackSprite(trackNum, HULL_WIDTH[hullNum]),
            new TurretSprite(color, turretNum,
                TURRET_INDENT_X[hullNum], (HULL_HEIGHT[hullNum] >> 1) - (TURRET_HEIGHT[turretNum] >> 1)),
            new WeaponSprite(weaponNum,
                TURRET_WIDTH[turretNum], (TURRET_HEIGHT[turretNum] >> 1) - (WEAPON_HEIGHT[weaponNum] >> 1))
        );
    }
}