import React from 'react';
import { DamageTakenEvent } from './useHudEvents';

/**
 * Красная дуга по краю экрана, указывающая направление, откуда прилетел урон.
 * Не зависит от canvas — чистый SVG, поэтому работает поверх любого рендерера.
 */
const DamageDirection: React.FC<{ events: DamageTakenEvent[] }> = ({ events }) => {
    if (events.length === 0) return null;
    return (
        <svg className="damage-direction" viewBox="-100 -100 200 200" aria-hidden="true">
            {events.map((ev) => {
                const age = performance.now() - ev.createdAt;
                const life = 1200;
                const t = Math.min(1, age / life);
                const opacity = 1 - t;
                const angleDeg = (ev.worldAngle * 180) / Math.PI;
                return (
                    <path
                        key={ev.id}
                        d={arcPath(70, 60)}
                        style={{
                            transform: `rotate(${angleDeg}deg)`,
                            opacity: opacity * 0.75
                        }}
                    />
                );
            })}
        </svg>
    );
};

/**
 * Дуга длиной arcDeg° по окружности радиуса r, центр в 0,0.
 * Поворот всей дуги делается через CSS transform (см. style rotate выше).
 */
function arcPath(r: number, arcDeg: number): string {
    const half = (arcDeg / 2) * (Math.PI / 180);
    const x1 = Math.cos(-half) * r;
    const y1 = Math.sin(-half) * r;
    const x2 = Math.cos(half) * r;
    const y2 = Math.sin(half) * r;
    return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

export default DamageDirection;
