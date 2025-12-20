import React, { useState } from 'react';
import TankPartSelector from './TankPartSelector';
import TankPreview from './TankPreview';
import ColorSelector from './ColorSelector';

interface TankConfig {
    hullIndex: number;
    trackIndex: number;
    turretIndex: number;
    weaponIndex: number;
    colorIndex: number;
}

interface TankCustomizerProps {
    onAccept: () => void;
}

const TankCustomizer: React.FC<TankCustomizerProps> = ({ onAccept }) => {
    const [config, setConfig] = useState<TankConfig>({
        hullIndex: 0,
        trackIndex: 0,
        turretIndex: 0,
        weaponIndex: 0,
        colorIndex: 0,
    });

    const updateConfig = (key: keyof TankConfig, value: number) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    const handleAccept = () => {
        // Сохраняем конфигурацию в localStorage или передаем в игровую логику
        localStorage.setItem('tankConfig', JSON.stringify(config));
        onAccept();
    };

    return (
        <div className="tank-customizer">
            <div className="selectors-panel">
                <TankPartSelector
                    title="Корпус"
                    type="hull"
                    currentIndex={config.hullIndex}
                    maxIndex={7}
                    onChange={(index) => updateConfig('hullIndex', index)}
                />
                <TankPartSelector
                    title="Гусеницы"
                    type="track"
                    currentIndex={config.trackIndex}
                    maxIndex={3}
                    onChange={(index) => updateConfig('trackIndex', index)}
                />
                <TankPartSelector
                    title="Башня"
                    type="turret"
                    currentIndex={config.turretIndex}
                    maxIndex={7}
                    onChange={(index) => updateConfig('turretIndex', index)}
                />
                <TankPartSelector
                    title="Оружие"
                    type="weapon"
                    currentIndex={config.weaponIndex}
                    maxIndex={7}
                    onChange={(index) => updateConfig('weaponIndex', index)}
                />
            </div>

            <div className="preview-panel">
                <TankPreview config={config} />
                <ColorSelector
                    currentIndex={config.colorIndex}
                    onChange={(index) => updateConfig('colorIndex', index)}
                />
                <button className="accept-button" onClick={handleAccept}>
                    <img src="/src/img/GUI/ok.png" alt="Accept" />
                </button>
            </div>
        </div>
    );
};

export default TankCustomizer;

