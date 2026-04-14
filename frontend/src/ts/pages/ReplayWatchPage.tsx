import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getReplayPlayback } from '../auth/gameApi';
import { useAuth } from '../context/AuthContext';
import ReplayPlaybackScreen from '../components/ui/ReplayPlaybackScreen';

const ReplayWatchPage: React.FC = () => {
    const { replayId } = useParams<{ replayId: string }>();
    const { accessToken, authRestored } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [playback, setPlayback] = useState<Awaited<ReturnType<typeof getReplayPlayback>> | null>(null);

    useEffect(() => {
        if (!authRestored || !accessToken || !replayId) {
            return;
        }
        let cancelled = false;
        setLoading(true);
        setError('');
        getReplayPlayback(accessToken, replayId)
            .then((data) => {
                if (!cancelled) {
                    setPlayback(data);
                }
            })
            .catch((e) => {
                if (!cancelled) {
                    setError(e instanceof Error ? e.message : 'Не удалось открыть реплей');
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
    }, [authRestored, accessToken, replayId]);

    if (!replayId) {
        return (
            <div className="page-replay-watch page-message">
                <p>Не указан реплей.</p>
                <button type="button" className="auth-submit" onClick={() => navigate('/replays')}>
                    К списку
                </button>
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
                <button type="button" className="auth-submit" onClick={() => navigate('/replays')}>
                    К списку
                </button>
            </div>
        );
    }

    return (
        <ReplayPlaybackScreen
            meta={playback.meta}
            startMeta={playback.startMeta}
            actions={playback.actions}
            frames={playback.frames}
            onBack={() => navigate('/replays')}
        />
    );
};

export default ReplayWatchPage;
