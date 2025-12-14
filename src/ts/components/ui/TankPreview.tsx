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

const TankPreview: React.FC<TankPreviewProps> = ({ config }) => {
    const { hullIndex, trackIndex, turretIndex, weaponIndex, colorIndex } = config;

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

