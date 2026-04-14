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
                    Записи создаются после завершённых матчей (тип «standard»). Просмотр — по сохранённым кадрам с сервера.
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
