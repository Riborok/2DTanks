import React, { useCallback, useState } from 'react';
import TankPartSelector from './TankPartSelector';
import TankPreview from './TankPreview';
import ColorSelector from './ColorSelector';
import TankSetStats from './TankSetStats';
import TankPresetBar from './TankPresetBar';
import { useAuth } from '../../context/AuthContext';

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
    const { accessToken } = useAuth();
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

    const applyPreset = useCallback((p: {
        color: number;
        hullNum: number;
        trackNum: number;
        turretNum: number;
        weaponNum: number;
    }) => {
        setConfig({
            hullIndex: p.hullNum,
            trackIndex: p.trackNum,
            turretIndex: p.turretNum,
            weaponIndex: p.weaponNum,
            colorIndex: p.color
        });
    }, []);

    const handleAccept = () => {
        localStorage.setItem('tankConfig', JSON.stringify(config));
        onAccept();
    };

    return (
        <div className="tank-customizer">
            <header className="tank-customizer__topbar">
                <div className="tank-customizer__topbar-main">
                    <p className="tank-customizer__eyebrow">Подготовка</p>
                    <h1 className="tank-customizer__page-title">Сборка танка</h1>
                </div>
            </header>

            <div className="tank-customizer__body">
                <div className="tank-customizer__grid">
                    {/* Колонка 1 — модули */}
                    <aside className="tank-customizer__panel tank-customizer__parts tank-customizer__grid-col tank-customizer__grid-col--parts">
                        <header className="tank-customizer__panel-head">
                            <h2 className="tank-customizer__panel-title">Модули</h2>
                        </header>
                        <div className="tank-customizer__parts-grid">
                            <TankPartSelector
                                title="Корпус"
                                type="hull"
                                currentIndex={config.hullIndex}
                                maxIndex={7}
                                colorIndex={config.colorIndex}
                                onChange={(index) => updateConfig('hullIndex', index)}
                            />
                            <TankPartSelector
                                title="Гусеницы"
                                type="track"
                                currentIndex={config.trackIndex}
                                maxIndex={3}
                                colorIndex={config.colorIndex}
                                onChange={(index) => updateConfig('trackIndex', index)}
                            />
                            <TankPartSelector
                                title="Башня"
                                type="turret"
                                currentIndex={config.turretIndex}
                                maxIndex={7}
                                colorIndex={config.colorIndex}
                                onChange={(index) => updateConfig('turretIndex', index)}
                            />
                            <TankPartSelector
                                title="Оружие"
                                type="weapon"
                                currentIndex={config.weaponIndex}
                                maxIndex={7}
                                colorIndex={config.colorIndex}
                                onChange={(index) => updateConfig('weaponIndex', index)}
                            />
                        </div>
                    </aside>

                    {/* Колонка 2 — превью танка */}
                    <section className="tank-customizer__stage tank-customizer__grid-col tank-customizer__grid-col--stage">
                        <div className="tank-customizer__preview-card">
                            <header className="tank-customizer__preview-head">
                                <h2 className="tank-customizer__panel-title">Превью</h2>
                            </header>
                            <div className="tank-customizer__preview-frame">
                                <div className="tank-customizer__preview-scale">
                                    <TankPreview config={config} />
                                </div>
                            </div>
                            <div className="tank-customizer__preview-chips">
                                <span>К{config.hullIndex}</span>
                                <span>Г{config.trackIndex}</span>
                                <span>Б{config.turretIndex}</span>
                                <span>О{config.weaponIndex}</span>
                            </div>
                        </div>
                    </section>

                    {/* Колонка 3 — параметры сверху, сеты снизу (одновременно) */}
                    <aside className="tank-customizer__side tank-customizer__grid-col tank-customizer__grid-col--side">
                        <div className="tank-customizer__side-slot tank-customizer__side-slot--stats">
                            <TankSetStats
                                hullIndex={config.hullIndex}
                                trackIndex={config.trackIndex}
                                turretIndex={config.turretIndex}
                                weaponIndex={config.weaponIndex}
                            />
                        </div>
                        {accessToken && (
                            <div className="tank-customizer__side-slot tank-customizer__side-slot--presets">
                                <TankPresetBar
                                    current={{
                                        color: config.colorIndex,
                                        hullNum: config.hullIndex,
                                        trackNum: config.trackIndex,
                                        turretNum: config.turretIndex,
                                        weaponNum: config.weaponIndex
                                    }}
                                    onApply={applyPreset}
                                />
                            </div>
                        )}
                    </aside>
                </div>
            </div>

            <footer className="tank-customizer__footer">
                <div className="tank-customizer__footer-colors">
                    <span className="tank-customizer__palette-label">Окраска</span>
                    <ColorSelector
                        currentIndex={config.colorIndex}
                        onChange={(index) => updateConfig('colorIndex', index)}
                    />
                </div>
                <button type="button" className="ui-btn ui-btn-primary tank-customizer__cta" onClick={handleAccept}>
                    <span>Подтвердить</span>
                    <svg className="tank-customizer__cta-icon" viewBox="0 0 24 24" width={20} height={20} aria-hidden>
                        <path
                            fill="currentColor"
                            d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
                        />
                    </svg>
                </button>
            </footer>
        </div>
    );
};

export default TankCustomizer;
