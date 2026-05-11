import React, { useEffect, useMemo, useState } from 'react';
import type { WebSocketClient } from '../../online/WebSocketClient';

export type PlayHubGameMode = 'standard' | 'practice' | 'deathmatch';

export type PlayHubTab = 'create' | 'join';

interface ModeDef {
    mode: PlayHubGameMode;
    title: string;
    desc: string;
    badge?: string;
}

const MODES: ModeDef[] = [
    {
        mode: 'deathmatch',
        title: 'Арена',
        desc: 'FFA до 5 бойцов, 1 минута, побеждает лидер по фрагам.'
    },
    {
        mode: 'standard',
        title: 'Классика',
        desc: 'Атакующий vs Защитник: собери ключи и доберись до базы.'
    },
    {
        mode: 'practice',
        title: 'Тренировка',
        desc: 'Два игрока, без записи статистики и без лимита времени.'
    }
];

function modeTip(mode: PlayHubGameMode): string {
    const m = MODES.find((x) => x.mode === mode);
    return m?.desc ?? '';
}

interface PlayHubScreenProps {
    onCreateRoom: (mode: PlayHubGameMode) => void;
    onJoinRoom: (code: string) => void;
    error?: string;
    onClearError?: () => void;
    initialSelectedMode?: PlayHubGameMode;
    hubTab: PlayHubTab;
    onHubTabChange: (tab: PlayHubTab) => void;
    wsClient: WebSocketClient;
}

const PlayHubScreen: React.FC<PlayHubScreenProps> = ({
    onCreateRoom,
    onJoinRoom,
    error,
    onClearError,
    initialSelectedMode,
    hubTab,
    onHubTabChange,
    wsClient
}) => {
    const [roomCode, setRoomCode] = useState('');
    const [selected, setSelected] = useState<PlayHubGameMode>(initialSelectedMode ?? 'deathmatch');
    const [wsUi, setWsUi] = useState<'connecting' | 'online' | 'offline'>('connecting');

    useEffect(() => {
        if (initialSelectedMode) {
            setSelected(initialSelectedMode);
        }
    }, [initialSelectedMode]);

    useEffect(() => {
        const tick = () => {
            if (wsClient.isConnected()) {
                setWsUi('online');
                return;
            }
            const rs = wsClient.getReadyState();
            if (rs === WebSocket.CONNECTING) {
                setWsUi('connecting');
                return;
            }
            setWsUi((was) => (was === 'online' ? 'offline' : 'connecting'));
        };
        tick();
        const id = window.setInterval(tick, 400);
        return () => window.clearInterval(id);
    }, [wsClient]);

    const handleJoin = () => {
        const code = roomCode.trim().toUpperCase();
        if (code.length === 6) {
            onJoinRoom(code);
        }
    };

    const selectedMeta = useMemo(() => MODES.find((m) => m.mode === selected), [selected]);

    const wsLabel =
        wsUi === 'online'
            ? 'Сервер: онлайн'
            : wsUi === 'connecting'
              ? 'Сервер: подключение…'
              : 'Сервер: нет соединения';

    return (
        <div className="page-play-hub connection-screen playhub-screen">
            <div className="connection-container playhub-container">
                <header className="playhub-header">
                    <div className="playhub-header-top">
                        <h1 className="playhub-page-title">Играть онлайн</h1>
                        <span
                            className={`playhub-ws-badge playhub-ws-badge--${wsUi}`}
                            role="status"
                            aria-live="polite"
                        >
                            {wsLabel}
                        </span>
                    </div>
                    <p className="playhub-lead">Создайте комнату или введите код приглашения.</p>
                </header>

                <div className="playhub-tabs" role="tablist" aria-label="Действие">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={hubTab === 'create'}
                        className={`playhub-tab${hubTab === 'create' ? ' playhub-tab--active' : ''}`}
                        onClick={() => onHubTabChange('create')}
                    >
                        Создать комнату
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={hubTab === 'join'}
                        className={`playhub-tab${hubTab === 'join' ? ' playhub-tab--active' : ''}`}
                        onClick={() => onHubTabChange('join')}
                    >
                        Войти по коду
                    </button>
                </div>

                {error && (
                    <div className="playhub-error-banner" role="alert">
                        <span className="playhub-error-text">{error}</span>
                        {onClearError && (
                            <button type="button" className="playhub-error-dismiss" onClick={onClearError}>
                                Скрыть
                            </button>
                        )}
                    </div>
                )}

                {hubTab === 'create' && (
                    <section className="playhub-panel" aria-labelledby="playhub-create-heading">
                        <h2 id="playhub-create-heading" className="visually-hidden">
                            Создать комнату
                        </h2>
                        <div className="playhub-mode-chips" role="group" aria-label="Режим игры">
                            {MODES.map(({ mode, title, badge }) => (
                                <button
                                    key={mode}
                                    type="button"
                                    className={`playhub-chip${selected === mode ? ' playhub-chip--active' : ''}`}
                                    onClick={() => setSelected(mode)}
                                >
                                    {title}
                                    {badge && <span className="playhub-chip-badge">{badge}</span>}
                                </button>
                            ))}
                        </div>

                        <details className="playhub-mode-details">
                            <summary className="playhub-mode-details-summary">
                                Про режим: {selectedMeta?.title}
                            </summary>
                            <p className="playhub-mode-details-body">{modeTip(selected)}</p>
                        </details>

                        <div className="playhub-quick-start">
                            <button
                                type="button"
                                className="connection-button create-button playhub-primary-cta"
                                onClick={() => onCreateRoom(selected)}
                                disabled={wsUi === 'offline'}
                            >
                                Создать — {selectedMeta?.title}
                            </button>
                            <span className="playhub-quick-hint">
                                Код для друзей появится в лобби после создания комнаты.
                            </span>
                        </div>
                    </section>
                )}

                {hubTab === 'join' && (
                    <section className="playhub-panel" aria-labelledby="playhub-join-heading">
                        <h2 id="playhub-join-heading" className="visually-hidden">
                            Войти по коду
                        </h2>
                        <div className="playhub-join-card">
                            <div className="playhub-join-title">Код комнаты</div>
                            <div className="join-section">
                                <input
                                    type="text"
                                    className="room-code-input"
                                    placeholder="••••••"
                                    value={roomCode}
                                    onChange={(e) =>
                                        setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))
                                    }
                                    onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                                    maxLength={6}
                                    autoComplete="off"
                                    autoCapitalize="characters"
                                />
                                <button
                                    type="button"
                                    className="connection-button join-button"
                                    onClick={handleJoin}
                                    disabled={roomCode.length !== 6 || wsUi === 'offline'}
                                >
                                    Войти
                                </button>
                            </div>
                            <p className="playhub-side-note">Шесть символов — режим задаёт создатель комнаты.</p>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};

export default PlayHubScreen;
