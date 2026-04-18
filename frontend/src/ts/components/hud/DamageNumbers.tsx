import React from 'react';
import { HitEvent } from './useHudEvents';
import { ResolutionManager } from '../../constants/gameConstants';

/**
 * Всплывающие числа урона над танками. Координаты источника — мировые,
 * проецируем через текущий viewport ResolutionManager в экранные px.
 */
const DamageNumbers: React.FC<{ hits: HitEvent[] }> = ({ hits }) => {
    return (
        <div className="damage-numbers" aria-hidden="true">
            {hits.map((h) => {
                const age = performance.now() - h.createdAt;
                const life = 900;
                const t = Math.min(1, age / life);
                const y = h.y - t * 40;
                const screen = worldToScreen(h.x, y);
                return (
                    <div
                        key={h.id}
                        className="damage-number"
                        style={{
                            left: screen.x,
                            top: screen.y,
                            opacity: 1 - t,
                            transform: `translate(-50%, -100%) scale(${1 + t * 0.2})`
                        }}
                    >
                        −{h.dmg}
                    </div>
                );
            })}
        </div>
    );
};

function worldToScreen(wx: number, wy: number): { x: number; y: number } {
    return {
        x: ResolutionManager.worldToCanvasX(wx),
        y: ResolutionManager.worldToCanvasY(wy)
    };
}

export default DamageNumbers;
