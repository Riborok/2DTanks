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

interface OnlineTankCustomizerProps {
    onAccept: (config: {
        color: number;
        hullNum: number;
        trackNum: number;
        turretNum: number;
        weaponNum: number;
    }) => void;
    occupiedColors?: number[]; // Массив индексов занятых цветов
    myPlayerId?: string; // ID текущего игрока для исключения своего цвета из занятых
    players?: Array<{ playerId: string; tankConfig?: { color: number } }>; // Список игроков
}

const OnlineTankCustomizer: React.FC<OnlineTankCustomizerProps> = ({ onAccept, occupiedColors, myPlayerId, players }) => {
    const [config, setConfig] = useState<TankConfig>({
        hullIndex: 0,
        trackIndex: 0,
        turretIndex: 0,
        weaponIndex: 0,
        colorIndex: 0,
    });

    // Вычисляем занятые цвета из списка игроков (кроме текущего игрока)
    const getOccupiedColors = (): number[] => {
        if (occupiedColors) {
            return occupiedColors;
        }
        if (!players || !myPlayerId) {
            return [];
        }
        return players
            .filter(p => p.playerId !== myPlayerId && p.tankConfig?.color !== undefined)
            .map(p => p.tankConfig!.color);
    };

    const updateConfig = (key: keyof TankConfig, value: number) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    const handleAccept = () => {
        // Convert to server format
        const serverConfig = {
            color: config.colorIndex,
            hullNum: config.hullIndex,
            trackNum: config.trackIndex,
            turretNum: config.turretIndex,
            weaponNum: config.weaponIndex
        };
        onAccept(serverConfig);
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
                    occupiedColors={getOccupiedColors()}
                />
                <button className="accept-button" onClick={handleAccept}>
                    <img src="/src/img/GUI/ok.png" alt="Accept" />
                </button>
            </div>
        </div>
    );
};

export default OnlineTankCustomizer;
