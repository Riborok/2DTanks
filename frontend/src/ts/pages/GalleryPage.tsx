import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    getPublicGallery,
    getPublicGalleryReplayStats,
    likeReplay,
    unlikeReplay,
    type GalleryMatchStatRowDto,
    type GalleryReplayDto
} from '../auth/gameApi';
import { formatWholeStat } from '../utils/matchStatsFormat';

type SortMode = 'new' | 'top';

type StatsModalState =
    | { phase: 'loading'; replay: GalleryReplayDto }
    | { phase: 'ready'; replay: GalleryReplayDto; stats: GalleryMatchStatRowDto[] }
    | { phase: 'error'; replay: GalleryReplayDto; message: string };

function formatPercentStat(value: number): string {
    if (!Number.isFinite(value)) {
        return '0%';
    }
    const rounded = Math.round(value * 10) / 10;
    return `${Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(1)}%`;
}

function formatDurationMs(durationTicks: number | null): string {
    if (!durationTicks || durationTicks <= 0) return '—';
    const sec = Math.round(durationTicks / 60);
    const mm = Math.floor(sec / 60);
    const ss = sec % 60;
    return `${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;
}

function matchStatPlayerLabel(row: GalleryMatchStatRowDto): string {
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
    return roleRu;
}

const PAGE_SIZE = 30;

const GalleryPage: React.FC = () => {
    const { accessToken } = useAuth();
    const [items, setItems] = useState<GalleryReplayDto[]>([]);
    const [sort, setSort] = useState<SortMode>('new');
    const [offset, setOffset] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [endReached, setEndReached] = useState(false);
    const [statsModal, setStatsModal] = useState<StatsModalState | null>(null);

    const load = useCallback(
        async (reset: boolean) => {
            setLoading(true);
            setError(null);
            try {
                const nextOffset = reset ? 0 : offset;
                const rows = await getPublicGallery({ limit: PAGE_SIZE, offset: nextOffset, sort });
                setEndReached(rows.length < PAGE_SIZE);
                setItems((prev) => (reset ? rows : [...prev, ...rows]));
                setOffset(nextOffset + rows.length);
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Ошибка');
            } finally {
                setLoading(false);
            }
        },
        [offset, sort]
    );

    useEffect(() => {
        setItems([]);
        setOffset(0);
        setEndReached(false);
        void load(true);
    }, [sort]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!statsModal) {
            return;
        }
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setStatsModal(null);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [statsModal]);

    const openStatsModal = (replay: GalleryReplayDto) => {
        setStatsModal({ phase: 'loading', replay });
        void getPublicGalleryReplayStats(replay.replayId)
            .then((data) => {
                setStatsModal({
                    phase: 'ready',
                    replay,
                    stats: data.matchStats
                });
            })
            .catch((e: unknown) => {
                setStatsModal({
                    phase: 'error',
                    replay,
                    message: e instanceof Error ? e.message : 'Ошибка загрузки'
                });
            });
    };

    const closeStatsModal = () => setStatsModal(null);

    const toggleLike = async (replay: GalleryReplayDto) => {
        if (!accessToken) {
            setError('Войдите, чтобы ставить лайки');
            return;
        }
        try {
            const res = replay.likedByMe
                ? await unlikeReplay(accessToken, replay.replayId)
                : await likeReplay(accessToken, replay.replayId);
            setItems((prev) =>
                prev.map((r) =>
                    r.replayId === replay.replayId
                        ? { ...r, likeCount: res.likeCount, likedByMe: res.likedByMe }
                        : r
                )
            );
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Ошибка лайка');
        }
    };

    return (
        <div className="page-gallery">
            <div className="gallery-screen">
                <div className="gallery-panel">
                    <header className="gallery-header">
                        <h1 className="gallery-page-title">Галерея</h1>
                        <p className="gallery-lead">
                            Публичные повторы с включённой публикацией. Просмотр — по короткой ссылке.
                        </p>
                    </header>

                    <div className="gallery-tabs" role="tablist" aria-label="Сортировка галереи">
                        <button
                            type="button"
                            role="tab"
                            aria-selected={sort === 'new'}
                            className={sort === 'new' ? 'gallery-tab gallery-tab--active' : 'gallery-tab'}
                            onClick={() => setSort('new')}
                        >
                            Новые
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={sort === 'top'}
                            className={sort === 'top' ? 'gallery-tab gallery-tab--active' : 'gallery-tab'}
                            onClick={() => setSort('top')}
                        >
                            Топ по лайкам
                        </button>
                    </div>

                    {error && (
                        <div className="gallery-error" role="alert">
                            {error}
                        </div>
                    )}

                    <ul className="gallery-list">
                        {items.map((r) => {
                            const watchHref = r.slug ? `/s/${encodeURIComponent(r.slug)}` : null;
                            return (
                                <li key={r.replayId} className="gallery-card">
                                    <div className="gallery-card-title">{r.title}</div>
                                    <div className="gallery-card-meta">
                                        <button
                                            type="button"
                                            className="gallery-match-btn"
                                            onClick={() => openStatsModal(r)}
                                        >
                                            {r.roomCode ? (
                                                <>
                                                    Комната{' '}
                                                    <span className="gallery-match-code">{r.roomCode}</span>
                                                </>
                                            ) : (
                                                <>
                                                    Матч ·{' '}
                                                    <span className="gallery-match-code">
                                                        {r.matchId.replace(/-/g, '').slice(0, 8)}
                                                    </span>
                                                </>
                                            )}
                                        </button>
                                        <span>Автор: {r.ownerDisplayName || '—'}</span>
                                        <span>Длительность: {formatDurationMs(r.durationTicks)}</span>
                                        {r.winnerRole && <span>Победитель: {r.winnerRole}</span>}
                                    </div>
                                    <div className="gallery-card-actions">
                                        <button
                                            type="button"
                                            className={
                                                r.likedByMe
                                                    ? 'gallery-like gallery-like--active'
                                                    : 'gallery-like'
                                            }
                                            onClick={() => void toggleLike(r)}
                                            title={accessToken ? 'Лайк' : 'Войдите, чтобы лайкать'}
                                        >
                                            <span aria-hidden>★</span>
                                            <span className="gallery-like-count">{r.likeCount}</span>
                                        </button>
                                        {watchHref ? (
                                            <Link to={watchHref} className="ui-btn ui-btn-primary gallery-watch-btn">
                                                Смотреть
                                            </Link>
                                        ) : (
                                            <span
                                                className="ui-btn ui-btn-secondary gallery-watch-btn gallery-watch-btn--disabled"
                                                aria-disabled
                                            >
                                                Нет ссылки
                                            </span>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>

                    {items.length === 0 && !loading && !error && (
                        <div className="gallery-empty">Пока что тут пусто.</div>
                    )}

                    {loading && (
                        <div className="gallery-loading" aria-busy="true">
                            <span className="gallery-loading-dot" />
                            <span className="gallery-loading-dot" />
                            <span className="gallery-loading-dot" />
                            <span className="gallery-loading-text">Загрузка…</span>
                        </div>
                    )}

                    {!loading && !endReached && items.length > 0 && (
                        <button
                            type="button"
                            className="ui-btn ui-btn-secondary gallery-load-more"
                            onClick={() => void load(false)}
                        >
                            Загрузить ещё
                        </button>
                    )}
                </div>
            </div>

            {statsModal && (
                <div className="gallery-stats-layer" role="presentation">
                    <button
                        type="button"
                        className="gallery-stats-backdrop"
                        aria-label="Закрыть"
                        onClick={closeStatsModal}
                    />
                    <div
                        className="gallery-stats-card"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="gallery-stats-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 id="gallery-stats-title" className="gallery-stats-title">
                            Статистика матча
                        </h2>
                        <p className="gallery-stats-subtitle">{statsModal.replay.title}</p>

                        {statsModal.phase === 'loading' && (
                            <div className="gallery-stats-loading" aria-busy="true">
                                <span className="gallery-loading-dot" />
                                <span className="gallery-loading-dot" />
                                <span className="gallery-loading-dot" />
                                <span className="gallery-loading-text">Загрузка…</span>
                            </div>
                        )}

                        {statsModal.phase === 'error' && (
                            <p className="gallery-stats-err" role="alert">
                                {statsModal.message}
                            </p>
                        )}

                        {statsModal.phase === 'ready' && statsModal.stats.length === 0 && (
                            <p className="gallery-stats-empty">Статистика для этого матча не сохранена.</p>
                        )}

                        {statsModal.phase === 'ready' && statsModal.stats.length > 0 && (
                            <div className="ui-table-wrap game-end-table-wrap gallery-stats-table-wrap">
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
                                        {statsModal.stats.map((row) => {
                                            const acc =
                                                row.shotsFired > 0
                                                    ? (row.shotsHit / row.shotsFired) * 100
                                                    : 0;
                                            return (
                                                <tr key={row.playerId}>
                                                    <td>{matchStatPlayerLabel(row)}</td>
                                                    <td>{formatWholeStat(row.kills)}</td>
                                                    <td>{formatWholeStat(row.deaths)}</td>
                                                    <td>{formatWholeStat(row.damageDealt)}</td>
                                                    <td>{formatWholeStat(row.damageTaken)}</td>
                                                    <td>{formatWholeStat(row.shotsFired)}</td>
                                                    <td>{formatWholeStat(row.shotsHit)}</td>
                                                    <td>{formatPercentStat(acc)}</td>
                                                    <td>{formatWholeStat(row.keyPickups + row.ammoPickups)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <button type="button" className="ui-btn ui-btn-secondary gallery-stats-close" onClick={closeStatsModal}>
                            Закрыть
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GalleryPage;
