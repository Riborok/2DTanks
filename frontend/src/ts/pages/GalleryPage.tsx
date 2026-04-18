import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    getPublicGallery,
    likeReplay,
    unlikeReplay,
    type GalleryReplayDto
} from '../auth/gameApi';

type SortMode = 'new' | 'top';

function formatDurationMs(durationTicks: number | null): string {
    if (!durationTicks || durationTicks <= 0) return '—';
    // Предполагается 60 tick/sec (совпадает с сервером).
    const sec = Math.round(durationTicks / 60);
    const mm = Math.floor(sec / 60);
    const ss = sec % 60;
    return `${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;
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
        // load зависит от sort — reset при смене режима
    }, [sort]); // eslint-disable-line react-hooks/exhaustive-deps

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
        <div className="gallery-page">
            <h1 className="gallery-title">Публичная галерея реплеев</h1>
            <p className="gallery-hint">
                Сюда попадают реплеи, для которых владелец включил публикацию. Просмотр доступен по короткой ссылке.
            </p>

            <div className="gallery-controls">
                <button
                    type="button"
                    className={`gallery-sort${sort === 'new' ? ' gallery-sort--active' : ''}`}
                    onClick={() => setSort('new')}
                >
                    Новые
                </button>
                <button
                    type="button"
                    className={`gallery-sort${sort === 'top' ? ' gallery-sort--active' : ''}`}
                    onClick={() => setSort('top')}
                >
                    Топ по лайкам
                </button>
            </div>

            {error && <div className="gallery-error">{error}</div>}

            <ul className="gallery-list">
                {items.map((r) => {
                    const watchHref = r.slug ? `/s/${encodeURIComponent(r.slug)}` : null;
                    return (
                        <li key={r.replayId} className="gallery-card">
                            <div className="gallery-card-title">{r.title}</div>
                            <div className="gallery-card-meta">
                                <span>Автор: {r.ownerDisplayName || '—'}</span>
                                <span>Длительность: {formatDurationMs(r.durationTicks)}</span>
                                {r.winnerRole && <span>Победитель: {r.winnerRole}</span>}
                            </div>
                            <div className="gallery-card-actions">
                                <button
                                    type="button"
                                    className={`gallery-like${r.likedByMe ? ' gallery-like--active' : ''}`}
                                    onClick={() => toggleLike(r)}
                                    title={accessToken ? 'Поставить лайк' : 'Войдите, чтобы лайкать'}
                                >
                                    <span aria-hidden>★</span>
                                    <span className="gallery-like-count">{r.likeCount}</span>
                                </button>
                                {watchHref ? (
                                    <Link to={watchHref} className="gallery-watch">
                                        Смотреть
                                    </Link>
                                ) : (
                                    <span className="gallery-watch gallery-watch--disabled">
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

            {loading && <div className="gallery-loading">Загрузка…</div>}

            {!loading && !endReached && items.length > 0 && (
                <button type="button" className="gallery-load-more" onClick={() => load(false)}>
                    Загрузить ещё
                </button>
            )}
        </div>
    );
};

export default GalleryPage;
