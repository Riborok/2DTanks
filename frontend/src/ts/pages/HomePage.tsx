import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getDashboard, type DashboardMode, type DashboardDto } from '../auth/gameApi';
import { useAuth } from '../context/AuthContext';
import {
    TANKS_PENDING_JOIN_ROOM_EVENT,
    TANKS_PENDING_JOIN_ROOM_STORAGE_KEY
} from '../context/GameSocketContext';

const MODE_LABEL: Record<DashboardMode, string> = {
    deathmatch: 'Арена',
    standard: 'Классика',
    practice: 'Тренировка',
    solo: 'Соло'
};

function formatDate(value: string | null): string {
    if (!value) return '—';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return '—';
    }
    return parsed.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

const HomePage: React.FC = () => {
    const { authUser, accessToken } = useAuth();
    const navigate = useNavigate();
    const [dashboard, setDashboard] = useState<DashboardDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [quickJoinCode, setQuickJoinCode] = useState('');
    const [quickJoinError, setQuickJoinError] = useState('');

    useEffect(() => {
        if (!accessToken) {
            setDashboard(null);
            setLoading(false);
            return;
        }
        let cancelled = false;
        setLoading(true);
        setError('');
        void getDashboard(accessToken)
            .then((data) => {
                if (!cancelled) {
                    setDashboard(data);
                }
            })
            .catch((e) => {
                if (!cancelled) {
                    setError(e instanceof Error ? e.message : 'Не удалось загрузить дашборд');
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

    const lastModeLabel = useMemo(() => {
        if (!dashboard?.lastMode) return 'Нет данных';
        return MODE_LABEL[dashboard.lastMode] ?? 'Нет данных';
    }, [dashboard?.lastMode]);

    const goPlayWithJoin = (roomCode: string) => {
        const code = roomCode.trim().toUpperCase();
        if (code.length !== 6) {
            setQuickJoinError('Код комнаты должен содержать 6 символов');
            return;
        }
        setQuickJoinError('');
        try {
            sessionStorage.setItem(TANKS_PENDING_JOIN_ROOM_STORAGE_KEY, code);
        } catch {
            /* ignore */
        }
        try {
            window.dispatchEvent(new CustomEvent(TANKS_PENDING_JOIN_ROOM_EVENT, { detail: { code } }));
        } catch {
            /* ignore */
        }
        void navigate('/play');
    };

    const handleContinue = () => {
        const roomCode = dashboard?.resumePayload?.roomCode;
        if (roomCode) {
            goPlayWithJoin(roomCode);
            return;
        }
        void navigate('/play');
    };

    const handleQuickJoin = () => {
        goPlayWithJoin(quickJoinCode);
    };

    return (
        <div className="page-home">
            <header className="page-home-header">
                <h1 className="page-home-title">Добро пожаловать{authUser ? `, ${authUser.displayName}` : ''}</h1>
                {loading && <span className="page-home-status">Загрузка…</span>}
                {error && <span className="page-home-status page-home-status--error">{error}</span>}
            </header>
            <p className="page-home-lead">Сводка и быстрый вход</p>

            <div className="page-home-dashboard-grid">
                <section className="page-home-dashboard-card page-home-dashboard-card--continue">
                    <h2 className="page-home-dashboard-title">Продолжить</h2>
                    <p className="page-home-dashboard-text">
                        {dashboard?.canResume
                            ? `Есть активная комната ${dashboard.resumePayload?.roomCode ?? ''}.`
                            : 'Активной комнаты нет. Можно сразу перейти в игровой хаб.'}
                    </p>
                    <button type="button" className="connection-button create-button page-home-continue-btn" onClick={handleContinue}>
                        {dashboard?.canResume ? 'Продолжить матч' : 'Перейти в игру'}
                    </button>
                    <div className="page-home-quick-join">
                        <label className="page-home-quick-join-label" htmlFor="homeQuickJoin">
                            Быстрый вход по коду
                        </label>
                        <div className="page-home-quick-join-controls">
                            <input
                                id="homeQuickJoin"
                                type="text"
                                className="room-code-input"
                                placeholder="Код комнаты"
                                value={quickJoinCode}
                                onChange={(e) => setQuickJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                                onKeyDown={(e) => e.key === 'Enter' && handleQuickJoin()}
                                maxLength={6}
                                autoComplete="off"
                                autoCapitalize="characters"
                            />
                            <button
                                type="button"
                                className="connection-button join-button"
                                onClick={handleQuickJoin}
                                disabled={quickJoinCode.length !== 6}
                            >
                                Войти
                            </button>
                        </div>
                        {quickJoinError && <p className="page-home-inline-error">{quickJoinError}</p>}
                    </div>
                </section>

                <section className="page-home-dashboard-card">
                    <h2 className="page-home-dashboard-title">Последний режим</h2>
                    {dashboard?.lastMode ? (
                        <Link
                            className="page-home-dashboard-big page-home-mode-to-play"
                            to={`/play?mode=${dashboard.lastMode}`}
                            title="Открыть игру с этим режимом"
                        >
                            {lastModeLabel}
                        </Link>
                    ) : (
                        <p className="page-home-dashboard-big">{lastModeLabel}</p>
                    )}
                    {dashboard?.resumePayload?.mode && (
                        <p className="page-home-dashboard-text">
                            Сейчас в комнате:{' '}
                            <Link
                                className="page-home-inline-mode-link"
                                to={`/play?mode=${dashboard.resumePayload.mode}`}
                            >
                                {MODE_LABEL[dashboard.resumePayload.mode]}
                            </Link>
                        </p>
                    )}
                </section>

                <section className="page-home-dashboard-card page-home-dashboard-card--footer-cta">
                    <h2 className="page-home-dashboard-title">Последние повторы</h2>
                    <div className="page-home-dashboard-card-body">
                        {dashboard?.recentReplays?.length ? (
                            <ul className="page-home-mini-list">
                                {dashboard.recentReplays.slice(0, 2).map((replay) => (
                                    <li key={replay.replayId} className="page-home-mini-list-item">
                                        <Link to={`/replays/watch/${replay.replayId}`} className="page-home-mini-link">
                                            {replay.title}
                                        </Link>
                                        <span className="page-home-mini-meta">{formatDate(replay.endedAt)}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="page-home-dashboard-text">Пока нет записей. Сыграйте матч, чтобы они появились.</p>
                        )}
                    </div>
                    <Link className="page-home-mini-cta" to="/replays">
                        Открыть повторы
                    </Link>
                </section>

                <section className="page-home-dashboard-card page-home-dashboard-card--friends-span page-home-dashboard-card--footer-cta">
                    <h2 className="page-home-dashboard-title">Друзья онлайн</h2>
                    <div className="page-home-dashboard-card-body">
                        <p className="page-home-dashboard-text">
                            {dashboard ? `${dashboard.onlineFriendsCount} из ${dashboard.friendsCount}` : '—'}
                        </p>
                        {dashboard?.onlineFriends?.length ? (
                            <ul className="page-home-mini-list">
                                {dashboard.onlineFriends.slice(0, 3).map((friend) => (
                                    <li key={friend.userId} className="page-home-mini-list-item">
                                        <span className="page-home-mini-link">
                                            {friend.displayName?.trim() || friend.login}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="page-home-dashboard-text">Сейчас никто из друзей не в сети.</p>
                        )}
                    </div>
                    <Link className="page-home-mini-cta" to="/friends">
                        Открыть друзей
                    </Link>
                </section>
            </div>
        </div>
    );
};

export default HomePage;
