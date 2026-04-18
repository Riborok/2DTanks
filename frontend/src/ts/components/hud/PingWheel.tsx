import React from 'react';

export type PingType = 'careful' | 'enemy' | 'attack' | 'retreat';

const OPTIONS: Array<{ id: PingType; label: string; dx: number; dy: number }> = [
    { id: 'careful', label: 'Осторожно', dx: 0, dy: -80 },
    { id: 'enemy', label: 'Вижу врага', dx: 80, dy: 0 },
    { id: 'attack', label: 'Атакую', dx: 0, dy: 80 },
    { id: 'retreat', label: 'Отступаю', dx: -80, dy: 0 }
];

const PingWheel: React.FC<{ onPick: (type: PingType) => void; onClose: () => void }> = ({ onPick, onClose }) => {
    return (
        <div className="ping-wheel" onClick={onClose} role="presentation">
            <div className="ping-wheel-inner" onClick={(e) => e.stopPropagation()}>
                {OPTIONS.map((o) => (
                    <button
                        key={o.id}
                        type="button"
                        className="ping-wheel-option"
                        style={{ transform: `translate(calc(-50% + ${o.dx}px), calc(-50% + ${o.dy}px))` }}
                        onClick={() => {
                            onPick(o.id);
                            onClose();
                        }}
                    >
                        {o.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default PingWheel;
