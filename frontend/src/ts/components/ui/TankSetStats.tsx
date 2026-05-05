import React, { useMemo } from 'react';
import { TankPartsCreator } from '../tank parts/TankPartsCreator';

interface TankSetStatsProps {
    hullIndex: number;
    trackIndex: number;
    turretIndex: number;
    weaponIndex: number;
}

type StatRow = {
    label: string;
    value: number;
    displayValue: string;
};

const clampToPercent = (value: number, min: number, max: number): number => {
    if (max <= min) {
        return 0;
    }
    return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
};

const TankSetStats: React.FC<TankSetStatsProps> = ({ hullIndex, trackIndex, turretIndex, weaponIndex }) => {
    const stats = useMemo(() => {
        const parts = TankPartsCreator.create(hullIndex, trackIndex, turretIndex, weaponIndex);

        const rows: StatRow[] = [
            { label: 'HP корпуса', value: parts.hull.health, displayValue: `${parts.hull.health}` },
            { label: 'Броня', value: parts.hull.armorStrength, displayValue: `${parts.hull.armorStrength}` },
            { label: 'Масса', value: parts.hull.mass + parts.turret.mass + parts.weapon.mass, displayValue: (parts.hull.mass + parts.turret.mass + parts.weapon.mass).toFixed(2) },
            { label: 'Скорость', value: parts.track.forwardData.finishSpeed, displayValue: parts.track.forwardData.finishSpeed.toFixed(2) },
            { label: 'Поворот', value: parts.track.angularData.finishSpeed, displayValue: parts.track.angularData.finishSpeed.toFixed(4) },
            { label: 'Поворот башни', value: parts.turret.angleSpeed, displayValue: parts.turret.angleSpeed.toFixed(5) },
            { label: 'Перезарядка', value: parts.weapon.reloadSpeed, displayValue: `${parts.weapon.reloadSpeed} мс` },
            { label: 'Урон', value: parts.weapon.damageCoeff, displayValue: parts.weapon.damageCoeff.toFixed(2) }
        ];

        return rows.map((row) => {
            const ranges: Record<string, [number, number]> = {
                'HP корпуса': [80, 140],
                'Броня': [18, 30],
                'Масса': [0.8, 2.0],
                'Скорость': [1.4, 2.6],
                'Поворот': [0.016, 0.024],
                'Поворот башни': [0.0003, 0.001],
                'Перезарядка': [700, 1320],
                'Урон': [0.8, 1.35]
            };
            const [min, max] = ranges[row.label];
            const reverse = row.label === 'Перезарядка';
            const rawPercent = clampToPercent(row.value, min, max);
            return {
                ...row,
                percent: reverse ? 100 - rawPercent : rawPercent
            };
        });
    }, [hullIndex, trackIndex, turretIndex, weaponIndex]);

    return (
        <div className="tank-set-stats">
            <div className="tank-set-stats__rows">
                {stats.map((stat) => (
                    <div key={stat.label} className="tank-set-stats__row">
                        <div className="tank-set-stats__meta">
                            <span>{stat.label}</span>
                            <span>{stat.displayValue}</span>
                        </div>
                        <div className="tank-set-stats__bar">
                            <div className="tank-set-stats__bar-fill" style={{ width: `${stat.percent}%` }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TankSetStats;
