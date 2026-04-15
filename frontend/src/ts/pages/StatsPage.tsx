import React, { useEffect, useMemo, useState } from 'react';
import { listMatchHistory, type MatchHistoryItemDto } from '../auth/gameApi';
import { useAuth } from '../context/AuthContext';

const StatsPage: React.FC = () => {
    const { accessToken } = useAuth();
    const [matches, setMatches] = useState<MatchHistoryItemDto[]>([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);

    useEffect(() => {
        if (!accessToken) {
            return;
        }
        let cancelled = false;
        setLoading(true);
        setError('');
        listMatchHistory(accessToken)
            .then(({ matches: m }) => {
                if (!cancelled) {
                    setMatches(m);
                }
            })
            .catch((e) => {
                if (!cancelled) {
                    setError(e instanceof Error ? e.message : 'Ошибка загрузки');
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });
        return () => {
            cancelled = true;
        };
    }, [accessToken]);

    const { wins, losses } = useMemo(() => {
        let w = 0;
        let l = 0;
        for (const m of matches) {
            if (m.isWinner) {
                w++;
            } else {
                l++;
            }
        }
        return { wins: w, losses: l };
    }, [matches]);

    const recent = useMemo(() => matches.slice(0, 15), [matches]);

    return (
        <div className="page-stats">
            <h1 className="page-stats-title">Статистика</h1>
            <p className="page-stats-lead">История матчей по вашему аккаунту</p>

            {loading && <div className="replays-loading">Загрузка…</div>}
            {error && <div className="auth-form-error">{error}</div>}

            {!loading && !error && (
                <>
                    <div className="page-stats-summary">
                        <div className="page-stats-chip wins">Побед: {wins}</div>
                        <div className="page-stats-chip losses">Поражений: {losses}</div>
                        <div className="page-stats-chip total">Всего: {matches.length}</div>
                    </div>

                    {matches.length === 0 ? (
                        <p className="page-stats-empty">Пока нет завершённых матчей в базе для вашего аккаунта.</p>
                    ) : (
                        <ul className="replays-list page-stats-list">
                            {recent.map((m) => (
                                <li key={m.matchId} className="replays-item">
                                    <div className="replays-item-main">
                                        <strong>
                                            {m.roomCode ? `Комната ${m.roomCode}` : 'Матч'} — роль: {m.role}
                                        </strong>
                                        <span className="replays-meta">
                                            {m.isWinner ? 'Победа' : 'Поражение'} · {m.endReason ?? '—'} · тиков:{' '}
                                            {m.durationTicks ?? '—'}
                                        </span>
                                        <button
                                            type="button"
                                            className="replays-back-btn"
                                            onClick={() =>
                                                setExpandedMatchId((prev) =>
                                                    prev === m.matchId ? null : m.matchId
                                                )
                                            }
                                        >
                                            {expandedMatchId === m.matchId
                                                ? 'Скрыть детализацию'
                                                : 'Открыть статистику матча'}
                                        </button>
                                        {expandedMatchId === m.matchId && m.matchStats.length > 0 && (
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
                                                        {m.matchStats.map((row) => {
                                                            const accuracy =
                                                                row.shotsFired > 0
                                                                    ? (row.shotsHit / row.shotsFired) * 100
                                                                    : 0;
                                                            return (
                                                                <tr key={`${m.matchId}_${row.playerId}`}>
                                                                    <td>{row.playerId.slice(0, 12)}</td>
                                                                    <td>{row.kills}</td>
                                                                    <td>{row.deaths}</td>
                                                                    <td>{row.damageDealt}</td>
                                                                    <td>{row.damageTaken}</td>
                                                                    <td>{row.shotsFired}</td>
                                                                    <td>{row.shotsHit}</td>
                                                                    <td>{accuracy.toFixed(1)}%</td>
                                                                    <td>{row.keyPickups + row.ammoPickups}</td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </>
            )}
        </div>
    );
};

export default StatsPage;
