import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getPublicReplayPlayback } from '../auth/gameApi';
import ReplayPlaybackScreen from '../components/ui/ReplayPlaybackScreen';

/**
 * Публичная страница просмотра реплея по короткой ссылке /s/:slug.
 * Не требует авторизации — данные берутся из открытого API /api/public/replays/by-slug/:slug.
 */
const SharedReplayPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [playback, setPlayback] = useState<Awaited<ReturnType<typeof getPublicReplayPlayback>> | null>(null);

    useEffect(() => {
        if (!slug) return;
        let cancelled = false;
        setLoading(true);
        setError('');
        getPublicReplayPlayback(slug)
            .then((data) => {
                if (!cancelled) setPlayback(data);
            })
            .catch((e) => {
                if (!cancelled) setError(e instanceof Error ? e.message : 'Не удалось открыть реплей');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [slug]);

    if (!slug) {
        return (
            <div className="page-replay-watch page-message">
                <p>Не указана ссылка.</p>
            </div>
        );
    }
    if (loading) {
        return (
            <div className="page-replay-watch page-loading">
                <p className="page-loading-text">Загрузка записи…</p>
            </div>
        );
    }
    if (error || !playback) {
        return (
            <div className="page-replay-watch page-message">
                <p className="auth-form-error">{error || 'Нет данных'}</p>
                <button type="button" className="auth-submit" onClick={() => navigate('/home')}>
                    На главную
                </button>
            </div>
        );
    }
    return (
        <ReplayPlaybackScreen
            meta={playback.meta}
            startMeta={playback.startMeta}
            actions={playback.actions}
            events={playback.events}
            playerNames={playback.playerNames}
            onBack={() => navigate('/home')}
        />
    );
};

export default SharedReplayPage;
