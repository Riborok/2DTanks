import React from 'react';

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
    
    // Базовая позиция пушки из CSS (для turret 0, weapon 0)
    const baseWeaponLeft = 300;
    const baseWeaponTop = 165;
    
    // Получаем отступы для текущей пушки
    const [offsetX, offsetY] = WEAPON_PREVIEW_OFFSETS[weaponIndex] || [0, 0];
    
    // Вычисляем позицию пушки: базовая позиция + отступ
    const weaponLeft = baseWeaponLeft + offsetX;
    const weaponTop = baseWeaponTop + offsetY;

    return (
        <div className="tank-preview">
            <img
                src={`/src/img/tanks/Tracks/Track_${trackIndex}_Solo.png`}
                alt="Track"
                className="track-top-view"
            />
            <img
                src={`/src/img/tanks/Tracks/Track_${trackIndex}_Solo.png`}
                alt="Track"
                className="track-bottom-view"
            />
            <img
                src={`/src/img/tanks/Hulls/Hull_${hullIndex}/Hull_${colorIndex % 4}.png`}
                alt="Hull"
                className="hull-view"
            />
            <img
                src={`/src/img/tanks/Weapons/Weapon_${weaponIndex}.png`}
                alt="Weapon"
                className="weapon-view"
                style={{ left: `${weaponLeft}px`, top: `${weaponTop}px` }}
            />
            <img
                src={`/src/img/tanks/Turrets/Turret_${turretIndex}/Turret_${colorIndex % 4}.png`}
                alt="Turret"
                className="turret-view"
            />
        </div>
    );
};

export default TankPreview;

