import React, { useEffect, useState } from 'react';
import { gameImg, tankHullTurretPaletteSlot, tankHullTurretSpriteSuffix } from '../../constants/gameAssets';

function IconChevronLeft() {
    return (
        <svg className="tank-part-selector__nav-svg" viewBox="0 0 24 24" aria-hidden>
            <path
                fill="currentColor"
                d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12l4.58-4.59z"
            />
        </svg>
    );
}

function IconChevronRight() {
    return (
        <svg className="tank-part-selector__nav-svg" viewBox="0 0 24 24" aria-hidden>
            <path
                fill="currentColor"
                d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6-6-6z"
            />
        </svg>
    );
}

interface TankPartSelectorProps {
    title: string;
    type: 'hull' | 'track' | 'turret' | 'weapon';
    currentIndex: number;
    maxIndex: number;
    onChange: (index: number) => void;
    /** Индекс окраски (0–3 в кастомайзере) — для превью корпуса и башни */
    colorIndex?: number;
}

const TankPartSelector: React.FC<TankPartSelectorProps> = ({
    title,
    type,
    currentIndex,
    maxIndex,
    onChange,
    colorIndex = 0,
}) => {
    const handlePrev = () => {
        onChange(currentIndex > 0 ? currentIndex - 1 : maxIndex);
    };

    const handleNext = () => {
        onChange(currentIndex < maxIndex ? currentIndex + 1 : 0);
    };

    const primarySuffix = tankHullTurretSpriteSuffix(colorIndex);
    const legacySuffix = tankHullTurretPaletteSlot(colorIndex);
    const [hullTurretSpriteSuffix, setHullTurretSpriteSuffix] = useState(legacySuffix);

    useEffect(() => {
        setHullTurretSpriteSuffix(legacySuffix);
    }, [legacySuffix, currentIndex, type]);

    const getImagePath = () => {
        switch (type) {
            case 'hull':
                return gameImg(`tanks/Hulls/Hull_${currentIndex}/Hull_${hullTurretSpriteSuffix}.png`);
            case 'track':
                return gameImg(`tanks/Tracks/Track_${currentIndex}_Solo.png`);
            case 'turret':
                return gameImg(`tanks/Turrets/Turret_${currentIndex}/Turret_${hullTurretSpriteSuffix}.png`);
            case 'weapon':
                return gameImg(`tanks/Weapons/Weapon_${currentIndex}.png`);
        }
    };

    const variantLabel = `${currentIndex + 1} / ${maxIndex + 1}`;

    return (
        <div className="tank-part-selector">
            <p className="tank-part-selector__label">{title}</p>
            <div className="selector-view">
                <button
                    type="button"
                    className="tank-part-selector__nav-btn tank-part-selector__nav-btn--prev"
                    onClick={handlePrev}
                    aria-label={`Предыдущий вариант: ${title}`}
                >
                    <IconChevronLeft />
                </button>
                <div className="part-display">
                    <img
                        src={getImagePath()}
                        alt=""
                        className={`part-img ${type}`}
                        onError={() => {
                            if (type === 'hull' || type === 'turret') {
                                setHullTurretSpriteSuffix((s) =>
                                    s === legacySuffix ? primarySuffix : s
                                );
                            }
                        }}
                    />
                </div>
                <button
                    type="button"
                    className="tank-part-selector__nav-btn tank-part-selector__nav-btn--next"
                    onClick={handleNext}
                    aria-label={`Следующий вариант: ${title}`}
                >
                    <IconChevronRight />
                </button>
            </div>
            <div className="selector-info" aria-live="polite">
                <span className="tank-part-selector__variant">{variantLabel}</span>
                <span className="tank-part-selector__variant-hint">вариант</span>
            </div>
        </div>
    );
};

export default TankPartSelector;

