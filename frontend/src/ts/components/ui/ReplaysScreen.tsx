import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    listReplays,
    listMatchHistory,
    shareReplay,
    type ReplayListItemDto,
    type MatchHistoryItemDto
} from '../../auth/gameApi';

type Tab = 'replays' | 'history';

type ShareDialogState =
    | { kind: 'copied'; url: string }
    | { kind: 'manual'; url: string }
    | { kind: 'error'; message: string };

function matchHistoryPlayerLabel(row: {
    displayName?: string | null;
    playerId: string;
    role: string;
}): string {
    const name = row.displayName?.trim();
    if (name) {
        return name;
    }
    const roleRu =
        row.role === 'attacker'
            ? 'Атакующий'
            : row.role === 'defender'
              ? 'Защитник'
              : row.role === 'fighter'
                ? 'Боец'
                : row.role;
    return `${roleRu} · ${row.playerId.slice(0, 10)}…`;
}

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
    const [shareDialog, setShareDialog] = useState<ShareDialogState | null>(null);
    const shareUrlInputRef = useRef<HTMLInputElement>(null);
    const replaysCount = replays.length;
    const matchesCount = matches.length;

    const closeShareDialog = useCallback(() => {
        setShareDialog(null);
    }, []);

    const handleShareReplay = useCallback(
        async (replayId: string) => {
            try {
                const { slug } = await shareReplay(accessToken, replayId);
                const url = `${window.location.origin}/s/${slug}`;
                try {
                    await navigator.clipboard.writeText(url);
                    setShareDialog({ kind: 'copied', url });
                } catch {
                    setShareDialog({ kind: 'manual', url });
                }
            } catch (e) {
                setShareDialog({
                    kind: 'error',
                    message: e instanceof Error ? e.message : 'Не удалось получить ссылку'
                });
            }
        },
        [accessToken]
    );

    useEffect(() => {
        if (!shareDialog) {
            return;
        }
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                closeShareDialog();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [shareDialog, closeShareDialog]);

    useEffect(() => {
        if (shareDialog?.kind !== 'copied') {
            return;
        }
        const t = window.setTimeout(() => {
            setShareDialog((prev) => (prev?.kind === 'copied' && prev.url === shareDialog.url ? null : prev));
        }, 3200);
        return () => window.clearTimeout(t);
    }, [shareDialog]);

    useEffect(() => {
        if (shareDialog?.kind !== 'manual') {
            return;
        }
        const el = shareUrlInputRef.current;
        if (!el) {
            return;
        }
        el.focus();
        el.select();
    }, [shareDialog]);

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
                <header className="replays-header">
                    <div className="replays-header-text">
                        <h1 className="replays-page-title">Реплеи</h1>
                        <p className="replays-lead">
                            Записи после завершённых матчей. Воспроизведение по журналу действий и событий.
                        </p>
                    </div>
                    <button type="button" className="ui-btn ui-btn-secondary replays-header-back" onClick={onBack}>
                        На главную
                    </button>
                </header>

                <div className="replays-kpi-grid" aria-hidden="true">
                    <div className="replays-kpi-card">
                        <div className="replays-kpi-label">Реплеи</div>
                        <div className="replays-kpi-value">{replaysCount}</div>
                    </div>
                    <div className="replays-kpi-card">
                        <div className="replays-kpi-label">История</div>
                        <div className="replays-kpi-value">{matchesCount}</div>
                    </div>
                    <div className="replays-kpi-card replays-kpi-card--accent">
                        <div className="replays-kpi-label">Раздел</div>
                        <div className="replays-kpi-value">{tab === 'replays' ? 'Просмотр' : 'Статистика'}</div>
                    </div>
                </div>

                <div className="replays-tabs" role="tablist" aria-label="Раздел реплеев">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={tab === 'replays'}
                        className={tab === 'replays' ? 'replays-tab replays-tab--active' : 'replays-tab'}
                        onClick={() => setTab('replays')}
                    >
                        Мои реплеи
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={tab === 'history'}
                        className={tab === 'history' ? 'replays-tab replays-tab--active' : 'replays-tab'}
                        onClick={() => setTab('history')}
                    >
                        История матчей
                    </button>
                </div>

                {loading && (
                    <div className="replays-loading" aria-busy="true">
                        <span className="replays-loading-dot" />
                        <span className="replays-loading-dot" />
                        <span className="replays-loading-dot" />
                        <span className="replays-loading-text">Загрузка…</span>
                    </div>
                )}
                {error && (
                    <div className="replays-error" role="alert">
                        {error}
                    </div>
                )}

                {!loading && tab === 'replays' && (
                    <ul className="replays-list replays-cards-list">
                        {replays.length === 0 && <li className="replays-empty">Пока нет записей. Сыграйте матч до конца.</li>}
                        {replays.map((r) => (
                            <li key={r.replayId} className="replays-item replays-item-card">
                                <div className="replays-item-main">
                                    <strong className="replays-item-title">{r.title}</strong>
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
                                <div className="replays-item-actions">
                                    <button
                                        type="button"
                                        className="ui-btn ui-btn-primary replays-item-cta"
                                        onClick={() => onPlayReplay(r.replayId)}
                                    >
                                        Смотреть
                                    </button>
                                    <button
                                        type="button"
                                        className="ui-btn ui-btn-secondary replays-item-cta"
                                        onClick={() => void handleShareReplay(r.replayId)}
                                    >
                                        Поделиться
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                {!loading && tab === 'history' && (
                    <ul className="replays-list replays-cards-list">
                        {matches.length === 0 && (
                            <li className="replays-empty">Матчей в базе для вашего аккаунта пока нет.</li>
                        )}
                        {matches.map((m) => (
                            <li key={m.matchId} className="replays-item replays-item-card">
                                <div className="replays-item-main">
                                    <strong className="replays-item-title">
                                        {m.roomCode ? `Комната ${m.roomCode}` : 'Матч'} — роль: {m.role}
                                    </strong>
                                    <span className="replays-meta">
                                        {m.isWinner ? 'Победа' : 'Поражение'} · {m.endReason ?? '—'} · тиков:{' '}
                                        {m.durationTicks ?? '—'}
                                    </span>
                                    <button
                                        type="button"
                                        className="ui-btn ui-btn-secondary replays-stat-toggle"
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
                                        <div className="ui-table-wrap game-end-table-wrap replays-stats-table-wrap">
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
                                                                <td>{matchHistoryPlayerLabel(row)}</td>
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

                <button type="button" className="ui-btn ui-btn-secondary replays-bottom-back-btn" onClick={onBack}>
                    ← На главную
                </button>
            </div>

            {shareDialog && (
                <div className="replays-share-layer" role="presentation">
                    <button
                        type="button"
                        className="replays-share-backdrop"
                        aria-label="Закрыть"
                        onClick={closeShareDialog}
                    />
                    <div
                        className={
                            shareDialog.kind === 'error'
                                ? 'replays-share-card replays-share-card--error'
                                : shareDialog.kind === 'copied'
                                  ? 'replays-share-card replays-share-card--success'
                                  : 'replays-share-card'
                        }
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="replays-share-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {shareDialog.kind === 'copied' && (
                            <>
                                <div className="replays-share-icon replays-share-icon--ok" aria-hidden />
                                <h2 id="replays-share-title" className="replays-share-title">
                                    Ссылка скопирована
                                </h2>
                                <p className="replays-share-lead">Вставьте её в чат или браузер.</p>
                                <code className="replays-share-url-preview">{shareDialog.url}</code>
                                <button type="button" className="ui-btn ui-btn-secondary replays-share-close" onClick={closeShareDialog}>
                                    Готово
                                </button>
                            </>
                        )}
                        {shareDialog.kind === 'manual' && (
                            <>
                                <h2 id="replays-share-title" className="replays-share-title">
                                    Ссылка на реплей
                                </h2>
                                <p className="replays-share-lead">
                                    Автоматическое копирование недоступно. Скопируйте вручную или нажмите кнопку ниже.
                                </p>
                                <input
                                    ref={shareUrlInputRef}
                                    type="text"
                                    readOnly
                                    className="replays-share-url-field"
                                    value={shareDialog.url}
                                    onFocus={(e) => e.target.select()}
                                />
                                <div className="replays-share-actions">
                                    <button
                                        type="button"
                                        className="ui-btn ui-btn-primary"
                                        onClick={async () => {
                                            try {
                                                await navigator.clipboard.writeText(shareDialog.url);
                                                setShareDialog({ kind: 'copied', url: shareDialog.url });
                                            } catch {
                                                shareUrlInputRef.current?.focus();
                                                shareUrlInputRef.current?.select();
                                            }
                                        }}
                                    >
                                        Скопировать
                                    </button>
                                    <button type="button" className="ui-btn ui-btn-secondary" onClick={closeShareDialog}>
                                        Закрыть
                                    </button>
                                </div>
                            </>
                        )}
                        {shareDialog.kind === 'error' && (
                            <>
                                <div className="replays-share-icon replays-share-icon--err" aria-hidden />
                                <h2 id="replays-share-title" className="replays-share-title">
                                    Не удалось поделиться
                                </h2>
                                <p className="replays-share-error-text">{shareDialog.message}</p>
                                <button type="button" className="ui-btn ui-btn-secondary replays-share-close" onClick={closeShareDialog}>
                                    Закрыть
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReplaysScreen;
