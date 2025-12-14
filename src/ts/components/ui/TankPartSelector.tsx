import React from 'react';

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
                return `/src/img/tanks/Hulls/Hull_${currentIndex}/Hull_0.png`;
            case 'track':
                return `/src/img/tanks/Tracks/Track_${currentIndex}_Solo.png`;
            case 'turret':
                return `/src/img/tanks/Turrets/Turret_${currentIndex}/Turret_0.png`;
            case 'weapon':
                return `/src/img/tanks/Weapons/Weapon_${currentIndex}.png`;
        }
    };

    const getInfo = () => {
        // Здесь можно добавить детальную информацию о каждой части
        return `${title} ${currentIndex}`;
    };

    return (
        <div className="tank-part-selector">
            <div className="selector-view">
                <button className="nav-button" onClick={handlePrev}>
                    <img src="src/img/GUI/prev.png" alt="Prev" className="btn-img" />
                </button>
                <div className="part-display">
                    <img src={getImagePath()} alt={title} className={`part-img ${type}`} />
                </div>
                <button className="nav-button" onClick={handleNext}>
                    <img src="/src/img/GUI/next.png" alt="Next" className="btn-img" />
                </button>
            </div>
            <div className="selector-info">
                <p>{getInfo()}</p>
            </div>
        </div>
    );
};

export default TankPartSelector;

