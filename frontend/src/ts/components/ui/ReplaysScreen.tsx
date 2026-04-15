import React, { useEffect, useState } from 'react';
import {
    listReplays,
    listMatchHistory,
    type ReplayListItemDto,
    type MatchHistoryItemDto
} from '../../auth/gameApi';

type Tab = 'replays' | 'history';

interface ReplaysScreenProps {
    accessToken: string;
    onBack: () => void;
    onPlayReplay: (replayId: string) => void;
}

const ReplaysScreen: React.FC<ReplaysScreenProps> = ({ accessToken, onBack, onPlayReplay }) => {
    const [tab, setTab] = useState<Tab>('replays');
    const [replays, setReplays] = useState<ReplayListItemDto[]>([]);
    const [matches, setMatches] = useState<MatchHistoryItemDto[]>([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError('');
        const run = async () => {
            try {
                if (tab === 'replays') {
                    const { replays: r } = await listReplays(accessToken);
                    if (!cancelled) {
                        setReplays(r);
                    }
                } else {
                    const { matches: m } = await listMatchHistory(accessToken);
                    if (!cancelled) {
                        setMatches(m);
                    }
                }
            } catch (e) {
                if (!cancelled) {
                    setError(e instanceof Error ? e.message : 'Ошибка загрузки');
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };
        void run();
        return () => {
            cancelled = true;
        };
    }, [accessToken, tab]);

    return (
        <div className="replays-screen">
            <div className="replays-panel">
                <h1 className="game-title">Реплеи и история</h1>
                <p className="replays-sub">
                    Записи создаются после завершённых матчей (тип «standard»). Просмотр строится по журналу действий и
                    событий матча.
                </p>

                <div className="replays-tabs">
                    <button
                        type="button"
                        className={tab === 'replays' ? 'replays-tab active' : 'replays-tab'}
                        onClick={() => setTab('replays')}
                    >
                        Мои реплеи
                    </button>
                    <button
                        type="button"
                        className={tab === 'history' ? 'replays-tab active' : 'replays-tab'}
                        onClick={() => setTab('history')}
                    >
                        История матчей
                    </button>
                </div>

                {loading && <div className="replays-loading">Загрузка…</div>}
                {error && <div className="auth-form-error">{error}</div>}

                {!loading && tab === 'replays' && (
                    <ul className="replays-list">
                        {replays.length === 0 && <li className="replays-empty">Пока нет записей. Сыграйте матч до конца.</li>}
                        {replays.map((r) => (
                            <li key={r.replayId} className="replays-item">
                                <div className="replays-item-main">
                                    <strong>{r.title}</strong>
                                    <span className="replays-meta">
                                        {r.roomCode ? `Комната ${r.roomCode}` : 'Матч'} ·{' '}
                                        {r.matchStatus === 'completed'
                                            ? 'завершён'
                                            : r.matchStatus === 'aborted'
                                              ? 'прерван'
                                              : r.matchStatus ?? '—'}
                                        {r.winnerRole ? ` · победитель: ${r.winnerRole}` : ''}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    className="replays-play-btn"
                                    onClick={() => onPlayReplay(r.replayId)}
                                >
                                    Смотреть
                                </button>
                            </li>
                        ))}
                    </ul>
                )}

                {!loading && tab === 'history' && (
                    <ul className="replays-list">
                        {matches.length === 0 && (
                            <li className="replays-empty">Матчей в базе для вашего аккаунта пока нет.</li>
                        )}
                        {matches.map((m) => (
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
                                            ? 'Скрыть полную статистику'
                                            : 'Показать полную статистику'}
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
                                                        const acc =
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
                                                                <td>{acc.toFixed(1)}%</td>
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

                <button type="button" className="replays-back-btn" onClick={onBack}>
                    ← На главную
                </button>
            </div>
        </div>
    );
};

export default ReplaysScreen;
