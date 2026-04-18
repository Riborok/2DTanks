import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useGameWebSocket } from '../context/GameSocketContext';
import SpectateScreen from '../components/ui/SpectateScreen';

interface WatchableRoom {
    code: string;
    playerCount: number;
    spectatorCount: number;
    hasActiveGame: boolean;
    practiceMode: boolean;
    deathmatchMode: boolean;
}

const WatchPage: React.FC = () => {
    const { wsClient } = useGameWebSocket();
    const [rooms, setRooms] = useState<WatchableRoom[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeRoom, setActiveRoom] = useState<string | null>(null);
    const [manualCode, setManualCode] = useState('');

    const refresh = useCallback(async () => {
        setLoading(true);
        setError(null);
        const handleList = (msg: any) => {
            if (msg.type === 'spectate:list') {
                setRooms(msg.rooms ?? []);
                setLoading(false);
            }
        };
        const handleError = (msg: any) => {
            setError(msg.message || 'Ошибка');
            setLoading(false);
        };
        wsClient.on('spectate:list' as any, handleList as any);
        wsClient.on('error', handleError as any);
        try {
            await wsClient.connect();
            wsClient.send({ type: 'spectate:list' } as any);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Не удалось подключиться');
            setLoading(false);
        }
        return () => {
            wsClient.off('spectate:list' as any, handleList as any);
            wsClient.off('error', handleError as any);
        };
    }, [wsClient]);

    useEffect(() => {
        let cleanup: (() => void) | void;
        void (async () => {
            cleanup = await refresh();
        })();
        return () => {
            cleanup?.();
        };
    }, [refresh]);

    const joinRoom = (code: string) => {
        setActiveRoom(code);
    };

    const leaveSpectate = () => {
        setActiveRoom(null);
        void refresh();
    };

    const listBody = useMemo(() => {
        if (loading) return <div className="watch-empty">Загрузка…</div>;
        if (rooms.length === 0) {
            return <div className="watch-empty">Сейчас нет активных комнат для просмотра.</div>;
        }
        return (
            <ul className="watch-list">
                {rooms.map((r) => (
                    <li key={r.code} className="watch-card">
                        <div className="watch-card-title">
                            <code>{r.code}</code>
                            {r.hasActiveGame ? (
                                <span className="watch-status watch-status--live">LIVE</span>
                            ) : (
                                <span className="watch-status">лобби</span>
                            )}
                        </div>
                        <div className="watch-card-meta">
                            <span>Игроков: {r.playerCount}</span>
                            <span>Наблюдателей: {r.spectatorCount}</span>
                            {r.practiceMode && <span>режим: тренировка</span>}
                            {r.deathmatchMode && <span>режим: арена</span>}
                        </div>
                        <button type="button" className="watch-btn" onClick={() => joinRoom(r.code)}>
                            Смотреть
                        </button>
                    </li>
                ))}
            </ul>
        );
    }, [rooms, loading]);

    if (activeRoom) {
        return <SpectateScreen wsClient={wsClient} roomCode={activeRoom} onLeave={leaveSpectate} />;
    }

    return (
        <div className="watch-page">
            <h1 className="watch-title">Смотреть матч</h1>
            <p className="watch-hint">
                Вы видите все идущие игры на этом сервере. Подключение не занимает слот в комнате и не мешает игрокам.
            </p>

            <div className="watch-controls">
                <button type="button" className="watch-refresh" onClick={() => void refresh()} disabled={loading}>
                    Обновить
                </button>
                <form
                    className="watch-join-form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        const code = manualCode.trim().toUpperCase();
                        if (code.length > 0) {
                            joinRoom(code);
                        }
                    }}
                >
                    <input
                        className="watch-join-input"
                        type="text"
                        placeholder="Код комнаты"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value)}
                        maxLength={16}
                    />
                    <button type="submit" className="watch-btn">
                        Подключиться
                    </button>
                </form>
            </div>

            {error && <div className="watch-error">{error}</div>}

            {listBody}
        </div>
    );
};

export default WatchPage;
