import React from 'react';
import { gameImg } from '../../constants/gameAssets';

interface TankPartSelectorProps {
    title: string;
    type: 'hull' | 'track' | 'turret' | 'weapon';
    currentIndex: number;
    maxIndex: number;
    onChange: (index: number) => void;
}

const TankPartSelector: React.FC<TankPartSelectorProps> = ({
    title,
    type,
    currentIndex,
    maxIndex,
    onChange,
}) => {
    const handlePrev = () => {
        onChange(currentIndex > 0 ? currentIndex - 1 : maxIndex);
    };

    const handleNext = () => {
        onChange(currentIndex < maxIndex ? currentIndex + 1 : 0);
    };

    const getImagePath = () => {
        switch (type) {
            case 'hull':
                return gameImg(`tanks/Hulls/Hull_${currentIndex}/Hull_0.png`);
            case 'track':
                return gameImg(`tanks/Tracks/Track_${currentIndex}_Solo.png`);
            case 'turret':
                return gameImg(`tanks/Turrets/Turret_${currentIndex}/Turret_0.png`);
            case 'weapon':
                return gameImg(`tanks/Weapons/Weapon_${currentIndex}.png`);
        }
    };

    const variantLabel = `${currentIndex + 1} / ${maxIndex + 1}`;

    return (
        <div className="tank-part-selector">
            <p className="tank-part-selector__label">{title}</p>
            <div className="selector-view">
                <button type="button" className="nav-button" onClick={handlePrev} aria-label="Предыдущий вариант">
                    <img src={gameImg('GUI/prev.png')} alt="" className="btn-img" />
                </button>
                <div className="part-display">
                    <img src={getImagePath()} alt="" className={`part-img ${type}`} />
                </div>
                <button type="button" className="nav-button" onClick={handleNext} aria-label="Следующий вариант">
                    <img src={gameImg('GUI/next.png')} alt="" className="btn-img" />
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

