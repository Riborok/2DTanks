import React, { useEffect, useState } from 'react';
import { gameImg, tankHullTurretPaletteSlot, tankHullTurretSpriteSuffix } from '../../constants/gameAssets';

interface TankConfig {
    hullIndex: number;
    trackIndex: number;
    turretIndex: number;
    weaponIndex: number;
    colorIndex: number;
}

interface TankPreviewProps {
    config: TankConfig;
}

const WEAPON_PREVIEW_OFFSETS: Array<[number, number]> = [
    [0, 0],    // Weapon 0
    [3, 0],    // Weapon 1
    [-5, 0],    // Weapon 2
    [3, 0],    // Weapon 3
    [3, 0],    // Weapon 4
    [-20, 0],    // Weapon 5
    [-3, 0],    // Weapon 6
    [-9, 0],    // Weapon 7
];

const TankPreview: React.FC<TankPreviewProps> = ({ config }) => {
    const { hullIndex, trackIndex, turretIndex, weaponIndex, colorIndex } = config;
    const primarySuffix = tankHullTurretSpriteSuffix(colorIndex);
    const legacySuffix = tankHullTurretPaletteSlot(colorIndex);

    const [hullSpriteSuffix, setHullSpriteSuffix] = useState(legacySuffix);
    const [turretSpriteSuffix, setTurretSpriteSuffix] = useState(legacySuffix);

    useEffect(() => {
        setHullSpriteSuffix(legacySuffix);
        setTurretSpriteSuffix(legacySuffix);
    }, [legacySuffix, hullIndex, turretIndex]);

    // Базовая позиция пушки из CSS (для turret 0, weapon 0)
    const baseWeaponLeft = 300;
    const baseWeaponTop = 165;

    const [offsetX, offsetY] = WEAPON_PREVIEW_OFFSETS[weaponIndex] || [0, 0];

    const weaponLeft = baseWeaponLeft + offsetX;
    const weaponTop = baseWeaponTop + offsetY;

    return (
        <div className="tank-preview">
            <img
                src={gameImg(`tanks/Tracks/Track_${trackIndex}_Solo.png`)}
                alt="Track"
                className="track-top-view"
            />
            <img
                src={gameImg(`tanks/Tracks/Track_${trackIndex}_Solo.png`)}
                alt="Track"
                className="track-bottom-view"
            />
            <img
                src={gameImg(`tanks/Hulls/Hull_${hullIndex}/Hull_${hullSpriteSuffix}.png`)}
                alt="Hull"
                className="hull-view"
                onError={() =>
                    setHullSpriteSuffix((s) => (s === legacySuffix ? primarySuffix : s))
                }
            />
            <img
                src={gameImg(`tanks/Weapons/Weapon_${weaponIndex}.png`)}
                alt="Weapon"
                className="weapon-view"
                style={{ left: `${weaponLeft}px`, top: `${weaponTop}px` }}
            />
            <img
                src={gameImg(`tanks/Turrets/Turret_${turretIndex}/Turret_${turretSpriteSuffix}.png`)}
                alt="Turret"
                className="turret-view"
                onError={() =>
                    setTurretSpriteSuffix((s) => (s === legacySuffix ? primarySuffix : s))
                }
            />
        </div>
    );
};

export default TankPreview;
