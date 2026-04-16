import React, { useEffect, useMemo, useState } from 'react';
import TankPartSelector from './TankPartSelector';
import TankPreview from './TankPreview';
import ColorSelector from './ColorSelector';
import TankSetStats from './TankSetStats';

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
    const occupiedColorList = useMemo((): number[] => {
        if (occupiedColors) {
            return occupiedColors;
        }
        if (!players || !myPlayerId) {
            return [];
        }
        return players
            .filter(p => p.playerId !== myPlayerId && p.tankConfig?.color !== undefined)
            .map(p => p.tankConfig!.color);
    }, [occupiedColors, players, myPlayerId]);

    useEffect(() => {
        if (!occupiedColorList.includes(config.colorIndex)) {
            return;
        }
        const totalColors = 4;
        for (let step = 1; step <= totalColors; step += 1) {
            const candidate = (config.colorIndex + step) % totalColors;
            if (!occupiedColorList.includes(candidate)) {
                setConfig(prev => ({ ...prev, colorIndex: candidate }));
                return;
            }
        }
    }, [occupiedColorList, config.colorIndex]);

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
            <header className="tank-customizer__topbar">
                <div className="tank-customizer__topbar-main">
                    <p className="tank-customizer__eyebrow">Подготовка к бою</p>
                    <h1 className="tank-customizer__page-title">Сборка танка</h1>
                </div>
                <p className="tank-customizer__topbar-lede">
                    Выберите модули и свободную окраску. Занятые цвета других игроков недоступны.
                </p>
            </header>
            <div className="tank-customizer__body">
                <div className="tank-customizer__grid">
                    <aside className="tank-customizer__parts">
                        <header className="tank-customizer__parts-header">
                            <h2 className="tank-customizer__panel-title">Модули</h2>
                            <p className="tank-customizer__lede">Корпус, ходовая, башня и орудие.</p>
                        </header>
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
                    </aside>

                    <section className="tank-customizer__stage">
                        <header className="tank-customizer__stage-header">
                            <h2 className="tank-customizer__panel-title">Обзор и параметры</h2>
                            <p className="tank-customizer__lede tank-customizer__lede--muted">
                                Превью и расчёт характеристик для выбранного сета.
                            </p>
                        </header>
                        <div className="tank-customizer__preview-shell">
                            <div className="tank-customizer__preview-frame">
                                <div className="tank-customizer__preview-scale">
                                    <TankPreview config={config} />
                                </div>
                            </div>
                        </div>
                        <TankSetStats
                            hullIndex={config.hullIndex}
                            trackIndex={config.trackIndex}
                            turretIndex={config.turretIndex}
                            weaponIndex={config.weaponIndex}
                        />
                    </section>
                </div>
            </div>
            <footer className="tank-customizer__footer">
                <div className="tank-customizer__footer-colors">
                    <span className="tank-customizer__palette-label">Окраска</span>
                    <ColorSelector
                        currentIndex={config.colorIndex}
                        onChange={(index) => updateConfig('colorIndex', index)}
                        occupiedColors={occupiedColorList}
                    />
                </div>
                <button type="button" className="tank-customizer__cta" onClick={handleAccept}>
                    <span>Подтвердить</span>
                    <img src="/src/img/GUI/ok.png" alt="" className="tank-customizer__cta-icon" />
                </button>
            </footer>
        </div>
    );
};

export default OnlineTankCustomizer;
