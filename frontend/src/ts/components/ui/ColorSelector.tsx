import React from 'react';

interface ColorSelectorProps {
    currentIndex: number;
    onChange: (index: number) => void;
    occupiedColors?: number[]; // Массив индексов занятых цветов
}

const ColorSelector: React.FC<ColorSelectorProps> = ({ currentIndex, onChange, occupiedColors = [] }) => {
    const colors = [
        '#4c5977',
        '#766f4b',
        '#78574d',
        '#4e7b76',
    ];

    const handleColorClick = (index: number) => {
        if (!occupiedColors.includes(index)) {
            onChange(index);
        }
    };

    return (
        <div className="color-selector">
            <div className="color-list">
                {colors.map((color, index) => (
                    <div
                        key={index}
                        className={`color-item ${index === currentIndex ? 'color-selected' : ''} ${occupiedColors.includes(index) ? 'color-occupied' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => handleColorClick(index)}
                        title={occupiedColors.includes(index) ? 'Цвет уже выбран другим игроком' : `Цвет ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default ColorSelector;

