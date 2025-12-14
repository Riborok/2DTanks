import React from 'react';

interface ColorSelectorProps {
    currentIndex: number;
    onChange: (index: number) => void;
}

const ColorSelector: React.FC<ColorSelectorProps> = ({ currentIndex, onChange }) => {
    const colors = [
        '#4c5977',
        '#766f4b',
        '#78574d',
        '#4e7b76',
    ];

    const handlePrev = () => {
        onChange(currentIndex > 0 ? currentIndex - 1 : colors.length - 1);
    };

    const handleNext = () => {
        onChange(currentIndex < colors.length - 1 ? currentIndex + 1 : 0);
    };

    return (
        <div className="color-selector">
            <button className="nav-button" onClick={handlePrev}>
                <img src="/src/img/GUI/prev.png" alt="Prev" className="btn-img" />
            </button>
            <div
                className="color-display"
                style={{ backgroundColor: colors[currentIndex] }}
            />
            <button className="nav-button" onClick={handleNext}>
                <img src="/src/img/GUI/next.png" alt="Next" className="btn-img" />
            </button>
        </div>
    );
};

export default ColorSelector;

