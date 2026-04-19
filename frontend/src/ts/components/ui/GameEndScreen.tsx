import React, { useMemo, useState } from 'react';

export type DeathmatchScoreRow = { playerId: string; kills: number; displayName?: string };
export type PlayerMatchStatsRow = {
    playerId: string;
    role: 'attacker' | 'defender' | 'fighter';
    kills: number;
    deaths: number;
    shotsFired: number;
    shotsHit: number;
    damageDealt: number;
    damageTaken: number;
    keyPickups: number;
    ammoPickups: number;
    displayName?: string;
};

export interface GameEndScreenProps {
    onBackToMenu: () => void;
    mode: 'standard' | 'deathmatch';
    reason: string;
    winner?: 'attacker' | 'defender';
    myRole?: 'attacker' | 'defender' | 'fighter';
    scores?: DeathmatchScoreRow[];
    stats?: PlayerMatchStatsRow[];
    winnerPlayerIds?: string[];
    myPlayerId?: string;
}

const GameEndScreen: React.FC<GameEndScreenProps> = ({
    onBackToMenu,
    mode,
    reason,
    winner,
    myRole,
    scores = [],
    stats = [],
    winnerPlayerIds = [],
    myPlayerId
}) => {
    /** В deathmatch сразу показываем полную таблицу (план: пост-матчевые метрики). */
    const [showFullStats, setShowFullStats] = useState(() => mode === 'deathmatch');
    const sortedStats = [...stats].sort(
        (a, b) =>
            b.kills - a.kills ||
            b.damageDealt - a.damageDealt ||
            b.shotsHit - a.shotsHit
    );
    const myStats = useMemo(
        () => sortedStats.find((s) => s.playerId === myPlayerId) ?? null,
        [sortedStats, myPlayerId]
    );
    const renderStatsTable = () => (
        <div className="ui-table-wrap game-end-table-wrap">
            <table className="ui-table game-end-scoreboard-table">
            <thead>
                <tr>
                    <th>Игрок</th>
                    <th>K</th>
                    <th>D</th>
                    <th>Урон</th>
                    <th>Получено</th>
                    <th>Выстрелы</th>
                    <th>Попадания</th>
                    <th>Точность</th>
                    <th>Подборы</th>
                </tr>
            </thead>
            <tbody>
                {sortedStats.map((row) => {
                    const acc = row.shotsFired > 0 ? (row.shotsHit / row.shotsFired) * 100 : 0;
                    return (
                        <tr
                            key={row.playerId}
                            className={myPlayerId === row.playerId ? 'game-end-me' : undefined}
                        >
                            <td>
                                {row.displayName ?? row.playerId.slice(0, 12)}{' '}
                                <span className="game-end-role-tag">
                                    ({row.role === 'attacker' ? 'A' : row.role === 'defender' ? 'D' : 'F'})
                                </span>
                            </td>
                            <td>{row.kills}</td>
                            <td>{row.deaths}</td>
                            <td>{row.damageDealt}</td>
                            <td>{row.damageTaken}</td>
                            <td>{row.shotsFired}</td>
                            <td>{row.shotsHit}</td>
                            <td>{acc.toFixed(1)}%</td>
                            <td>{row.keyPickups + row.ammoPickups}</td>
                        </tr>
                    );
                })}
            </tbody>
            </table>
        </div>
    );

    if (mode === 'deathmatch') {
        const sorted = [...scores].sort((a, b) => b.kills - a.kills);
        const iWon = myPlayerId && winnerPlayerIds.includes(myPlayerId);
        return (
            <div className="game-end-screen">
                <h1>{iWon ? 'Победа!' : winnerPlayerIds.length ? 'Матч окончен' : 'Матч прерван'}</h1>
                <p className="game-end-reason">Итог: больше всего фрагов за 1 минуту. Причина: {reason}</p>
                <ul className="game-end-scoreboard">
                    {sorted.map((row) => (
                        <li
                            key={row.playerId}
                            className={winnerPlayerIds.includes(row.playerId) ? 'is-winner' : undefined}
                        >
                            {row.displayName ?? row.playerId.slice(0, 12)} — {row.kills}{' '}
                            {winnerPlayerIds.includes(row.playerId) ? '★' : ''}
                        </li>
                    ))}
                </ul>
                {myStats && (
                    <div className="game-end-top-stats">
                        <div className="game-end-top-stat">
                            <div className="game-end-top-stat-label">Ваши K/D</div>
                            <div className="game-end-top-stat-value">
                                {myStats.kills}/{myStats.deaths}
                            </div>
                        </div>
                        <div className="game-end-top-stat">
                            <div className="game-end-top-stat-label">Ваш урон</div>
                            <div className="game-end-top-stat-value">{myStats.damageDealt}</div>
                        </div>
                        <div className="game-end-top-stat">
                            <div className="game-end-top-stat-label">Ваша точность</div>
                            <div className="game-end-top-stat-value">
                                {myStats.shotsFired > 0
                                    ? `${((myStats.shotsHit / myStats.shotsFired) * 100).toFixed(1)}%`
                                    : '0.0%'}
                            </div>
                        </div>
                    </div>
                )}
                {sortedStats.length > 0 && showFullStats && renderStatsTable()}
                <div className="game-end-actions">
                    <button type="button" className="game-end-primary-btn" onClick={onBackToMenu}>
                        Вернуться в меню
                    </button>
                    {sortedStats.length > 0 && (
                        <button
                            type="button"
                            className="game-end-toggle-btn"
                            onClick={() => setShowFullStats((v) => !v)}
                        >
                            {showFullStats ? 'Скрыть полную статистику' : 'Показать полную статистику матча'}
                        </button>
                    )}
                </div>
            </div>
        );
    }

    const w = winner ?? 'defender';
    const r = myRole ?? 'attacker';
    return (
        <div className="game-end-screen">
            <h1>{w === r ? 'Победа!' : 'Поражение'}</h1>
            <p>Причина: {reason}</p>
            {myStats && (
                <div className="game-end-top-stats">
                    <div className="game-end-top-stat">
                        <div className="game-end-top-stat-label">Ваши K/D</div>
                        <div className="game-end-top-stat-value">
                            {myStats.kills}/{myStats.deaths}
                        </div>
                    </div>
                    <div className="game-end-top-stat">
                        <div className="game-end-top-stat-label">Ваш урон</div>
                        <div className="game-end-top-stat-value">{myStats.damageDealt}</div>
                    </div>
                    <div className="game-end-top-stat">
                        <div className="game-end-top-stat-label">Ваша точность</div>
                        <div className="game-end-top-stat-value">
                            {myStats.shotsFired > 0
                                ? `${((myStats.shotsHit / myStats.shotsFired) * 100).toFixed(1)}%`
                                : '0.0%'}
                        </div>
                    </div>
                </div>
            )}
            {sortedStats.length > 0 && showFullStats && renderStatsTable()}
            <div className="game-end-actions">
                <button type="button" className="game-end-primary-btn" onClick={onBackToMenu}>
                    Вернуться в меню
                </button>
                {sortedStats.length > 0 && (
                    <button
                        type="button"
                        className="game-end-toggle-btn"
                        onClick={() => setShowFullStats((v) => !v)}
                    >
                        {showFullStats ? 'Скрыть полную статистику' : 'Показать полную статистику матча'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default GameEndScreen;
