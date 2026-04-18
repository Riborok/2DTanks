import React, { useEffect, useRef, useState } from 'react';
import { WebSocketClient } from '../../online/WebSocketClient';
import { OnlineGameRenderer } from '../../online/OnlineGameRenderer';
import type { GameWorldSnapshot, ServerTank } from '../../online/types';
import { tankVisualFromSnapshot } from '../../online/tankVisualFromSnapshot';
import { ResolutionManager } from '../../constants/gameConstants';
import { ImagePreloader } from '../../utils/ImagePreloader';

interface SpectateScreenProps {
    wsClient: WebSocketClient;
    roomCode: string;
    /** Вызывается при выходе — родитель должен освободить ws и/или вернуться в hub. */
    onLeave: () => void;
}

/**
 * Экран режима наблюдателя: подписываемся на снапшоты комнаты и рисуем мир
 * тем же рендерером, что и боевой экран. Управление не передаётся.
 */
const SpectateScreen: React.FC<SpectateScreenProps> = ({ wsClient, roomCode, onLeave }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rendererRef = useRef<OnlineGameRenderer | null>(null);
    const snapshotRef = useRef<GameWorldSnapshot | null>(null);
    const [imagesLoaded, setImagesLoaded] = useState(false);
    const [status, setStatus] = useState<string>('Подключаемся…');
    const [error, setError] = useState<string | null>(null);
    const [playerNames, setPlayerNames] = useState<Map<string, string>>(new Map());

    useEffect(() => {
        ImagePreloader.preloadAll()
            .then(() => setImagesLoaded(true))
            .catch(() => setImagesLoaded(true));
    }, []);

    // Подписка на WS-сообщения
    useEffect(() => {
        const onSnapshot = (msg: { world?: GameWorldSnapshot }) => {
            if (msg.world) {
                snapshotRef.current = msg.world;
                if (rendererRef.current) {
                    for (const tank of (msg.world.tanks ?? []) as ServerTank[]) {
                        rendererRef.current.setTankConfig(tank.id, tankVisualFromSnapshot(tank));
                    }
                    rendererRef.current.updateFromSnapshot(msg.world);
                }
                setStatus('В эфире');
            }
        };
        const onRoomUpdate = (msg: any) => {
            const m = new Map<string, string>();
            for (const p of msg.players ?? []) {
                if (p.playerId) m.set(p.playerId, p.displayName || 'Игрок');
            }
            setPlayerNames(m);
            if (rendererRef.current) {
                rendererRef.current.setPlayerLabels(m);
            }
        };
        const onJoined = (msg: { hasActiveGame?: boolean }) => {
            // Слушатель уже на канале spectate:joined — проверка msg.type не нужна (и мешает, если формат сообщения изменится).
            setStatus(msg?.hasActiveGame ? 'Смотрим матч' : 'Комната ожидает начала игры');
        };
        const onGameStart = () => {
            setStatus('Матч начался');
        };
        const onLeft = () => {
            onLeave();
        };
        const onError = (msg: any) => {
            setError(msg.message || 'Ошибка');
        };

        wsClient.on('snapshot', onSnapshot as any);
        wsClient.on('roomUpdate', onRoomUpdate as any);
        wsClient.on('spectate:joined' as any, onJoined as any);
        wsClient.on('gameStart', onGameStart as any);
        wsClient.on('spectate:left' as any, onLeft as any);
        wsClient.on('error', onError as any);

        void wsClient.connect().then(() => {
            wsClient.send({ type: 'spectate:join', code: roomCode } as any);
        }).catch((e) => {
            setError(e instanceof Error ? e.message : 'Не удалось подключиться');
        });

        return () => {
            try {
                wsClient.send({ type: 'spectate:leave' } as any);
            } catch {
                /* ignore */
            }
            wsClient.off('snapshot', onSnapshot as any);
            wsClient.off('roomUpdate', onRoomUpdate as any);
            wsClient.off('spectate:joined' as any, onJoined as any);
            wsClient.off('gameStart', onGameStart as any);
            wsClient.off('spectate:left' as any, onLeft as any);
            wsClient.off('error', onError as any);
        };
    }, [wsClient, roomCode, onLeave]);

    // Рендер
    useEffect(() => {
        if (!canvasRef.current || !imagesLoaded) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            canvas.style.width = `${canvas.width}px`;
            canvas.style.height = `${canvas.height}px`;
            canvas.style.position = 'absolute';
            canvas.style.top = '0';
            canvas.style.left = '0';
            ResolutionManager.setViewport(canvas.width, canvas.height);
            return { width: canvas.width, height: canvas.height };
        };
        const size = resize();
        const renderer = new OnlineGameRenderer(ctx, size);
        renderer.setPlayerLabels(playerNames);
        rendererRef.current = renderer;

        const snap = snapshotRef.current;
        if (snap) {
            for (const tank of (snap.tanks ?? []) as ServerTank[]) {
                renderer.setTankConfig(tank.id, tankVisualFromSnapshot(tank));
            }
            renderer.updateFromSnapshot(snap);
        }

        const onResize = () => {
            const s = resize();
            rendererRef.current?.clear();
            rendererRef.current = new OnlineGameRenderer(ctx, s);
            rendererRef.current.setPlayerLabels(playerNames);
            if (snapshotRef.current) {
                rendererRef.current.updateFromSnapshot(snapshotRef.current);
            }
        };
        window.addEventListener('resize', onResize);

        let raf = 0;
        const loop = () => {
            rendererRef.current?.render();
            raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);

        return () => {
            window.removeEventListener('resize', onResize);
            cancelAnimationFrame(raf);
            rendererRef.current?.clear();
            rendererRef.current = null;
        };
    }, [imagesLoaded, playerNames]);

    return (
        <div className="spectate-screen">
            <canvas ref={canvasRef} className="spectate-canvas" />
            <div className="spectate-hud">
                <div className="spectate-hud-left">
                    <strong>Наблюдение</strong>
                    <span>Комната: <code>{roomCode}</code></span>
                    <span>{status}</span>
                    {error && <span className="spectate-error">{error}</span>}
                </div>
                <button type="button" className="spectate-leave" onClick={onLeave}>
                    Выйти
                </button>
            </div>
        </div>
    );
};

export default SpectateScreen;
