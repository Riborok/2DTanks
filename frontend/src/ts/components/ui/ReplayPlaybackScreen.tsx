import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { OnlineGameRenderer } from '../../online/OnlineGameRenderer';
import type { GameWorldSnapshot, ServerTank } from '../../online/types';
import { tankVisualFromSnapshot } from '../../online/tankVisualFromSnapshot';
import { ResolutionManager } from '../../constants/gameConstants';
import { ImagePreloader } from '../../utils/ImagePreloader';
import type {
    ReplayActionDto,
    ReplayEventDto,
    ReplayPlaybackMetaDto,
    ReplayStartMetaDto
} from '../../auth/gameApi';
import { interpolateReplaySnapshots } from '../../online/replayInterpolation';
import { buildReplayFramesClient } from '../../replay/buildReplayFramesClient';

interface ReplayPlaybackScreenProps {
    meta: ReplayPlaybackMetaDto;
    startMeta: ReplayStartMetaDto;
    actions: ReplayActionDto[];
    events?: ReplayEventDto[];
    onBack: () => void;
}

function applyTankConfigs(renderer: OnlineGameRenderer, world: GameWorldSnapshot | null): void {
    if (!world?.tanks?.length) {
        return;
    }
    for (const tank of world.tanks as ServerTank[]) {
        renderer.setTankConfig(tank.id, tankVisualFromSnapshot(tank));
    }
}

/** Должен совпадать с SNAPSHOT_STEP_TICKS в server/src/game/world/replaySimulator.ts */
const STORED_FRAME_STEP_TICKS = 1;

const ReplayPlaybackScreen: React.FC<ReplayPlaybackScreenProps> = ({
    meta,
    startMeta,
    actions,
    events = [],
    onBack
}) => {
    const builtFrames = useMemo(
        () =>
            buildReplayFramesClient({
                startMeta,
                actions,
                events,
                durationTicks: meta.durationTicks
            }),
        [meta.replayId, meta.durationTicks, startMeta, actions, events]
    );

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rendererRef = useRef<OnlineGameRenderer | null>(null);
    const snapshotRef = useRef<GameWorldSnapshot | null>(null);
    const framesRef = useRef(builtFrames);
    framesRef.current = builtFrames;

    const playingRef = useRef(true);
    const replayPositionFrameRef = useRef(0);
    const lastRafTimeRef = useRef(0);
    const lastDisplayFrameRef = useRef(-1);
    /** Последний индекс ключевого кадра — чтобы взрывы/импакты сработали один раз на кадр записи. */
    const replayKeyframeIdxRef = useRef(-1);

    const [imagesLoaded, setImagesLoaded] = useState(false);
    const [playing, setPlaying] = useState(true);
    const [displayFrame, setDisplayFrame] = useState(0);

    const frameMs = useMemo(() => {
        const hz = startMeta.tickRate > 0 ? startMeta.tickRate : 60;
        return (1000 / hz) * STORED_FRAME_STEP_TICKS;
    }, [startMeta.tickRate]);

    const totalReplayActions = actions.length;
    const totalReplayEvents = events.length;

    useEffect(() => {
        playingRef.current = playing;
        if (playing) {
            lastRafTimeRef.current = performance.now();
        }
    }, [playing]);

    useEffect(() => {
        ImagePreloader.preloadAll()
            .then(() => setImagesLoaded(true))
            .catch(() => setImagesLoaded(true));
    }, []);

    useEffect(() => {
        replayPositionFrameRef.current = 0;
        lastRafTimeRef.current = 0;
        lastDisplayFrameRef.current = -1;
        replayKeyframeIdxRef.current = -1;
        setDisplayFrame(0);
        setPlaying(true);
        playingRef.current = true;
    }, [meta.replayId]);

    const bumpDisplayFromPosition = useCallback(() => {
        const maxIdx = Math.max(0, framesRef.current.length - 1);
        const idx = Math.max(0, Math.min(maxIdx, Math.floor(replayPositionFrameRef.current)));
        if (idx !== lastDisplayFrameRef.current) {
            lastDisplayFrameRef.current = idx;
            setDisplayFrame(idx);
        }
    }, []);

    const stepReplayFrame = useCallback((delta: -1 | 1) => {
        setPlaying(false);
        const list = framesRef.current;
        const span = Math.max(0, list.length - 1);
        replayPositionFrameRef.current = Math.max(
            0,
            Math.min(span, replayPositionFrameRef.current + delta)
        );
        replayKeyframeIdxRef.current = -1;
        bumpDisplayFromPosition();
    }, [bumpDisplayFromPosition]);

    useEffect(() => {
        if (!canvasRef.current || !imagesLoaded) {
            return;
        }

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return;
        }

        const resizeCanvas = () => {
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

        const size = resizeCanvas();
        const renderer = new OnlineGameRenderer(ctx, size);
        rendererRef.current = renderer;

        const initial = (framesRef.current[0]?.world as GameWorldSnapshot | undefined) ?? null;
        if (initial) {
            applyTankConfigs(renderer, initial);
            snapshotRef.current = initial;
            lastDisplayFrameRef.current = 0;
            replayKeyframeIdxRef.current = 0;
            renderer.updateFromSnapshot(initial);
            setDisplayFrame(0);
        }

        const handleResize = () => {
            const newSize = resizeCanvas();
            rendererRef.current?.clear();
            rendererRef.current = new OnlineGameRenderer(ctx, newSize);
            const snap = snapshotRef.current;
            if (snap) {
                applyTankConfigs(rendererRef.current, snap);
                rendererRef.current.updateFromSnapshot(snap);
            }
        };

        window.addEventListener('resize', handleResize);

        let raf = 0;
        const loop = () => {
            const flist = framesRef.current;
            const span = Math.max(0, flist.length - 1);
            const now = performance.now();
            if (lastRafTimeRef.current === 0) {
                lastRafTimeRef.current = now;
            }
            const dt = now - lastRafTimeRef.current;
            lastRafTimeRef.current = now;

            if (playingRef.current && span > 0) {
                replayPositionFrameRef.current += dt / frameMs;
                while (replayPositionFrameRef.current > span) {
                    replayPositionFrameRef.current -= span;
                }
            }

            if (flist.length > 0) {
                const spanIdx = Math.max(0, flist.length - 1);
                const idx = Math.max(0, Math.min(spanIdx, Math.floor(replayPositionFrameRef.current)));
                const alpha = replayPositionFrameRef.current - idx;
                const wA = flist[idx].world as GameWorldSnapshot;
                const wB = flist[Math.min(idx + 1, spanIdx)].world as GameWorldSnapshot;
                const merged = interpolateReplaySnapshots(wA, wB, alpha);

                if (idx !== replayKeyframeIdxRef.current) {
                    replayKeyframeIdxRef.current = idx;
                    const landed = flist[idx].world as GameWorldSnapshot;
                    merged.explosions = landed.explosions ? [...landed.explosions] : [];
                    merged.grenadeExplosions = landed.grenadeExplosions ? [...landed.grenadeExplosions] : [];
                    merged.bulletImpacts = landed.bulletImpacts ? [...landed.bulletImpacts] : [];
                }

                snapshotRef.current = merged;
                if (idx !== lastDisplayFrameRef.current) {
                    lastDisplayFrameRef.current = idx;
                    setDisplayFrame(idx);
                }
                if (rendererRef.current) {
                    rendererRef.current.updateFromSnapshot(merged);
                }
            } else {
                snapshotRef.current = null;
                replayKeyframeIdxRef.current = -1;
            }

            if (rendererRef.current && snapshotRef.current) {
                rendererRef.current.render();
            }
            raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(raf);
            rendererRef.current?.clear();
            rendererRef.current = null;
        };
    }, [frameMs, imagesLoaded, meta.replayId, builtFrames]);

    if (!builtFrames.length) {
        return (
            <div className="replay-playback-screen">
                <div className="replay-playback-hud">
                    <span>{meta.title}</span>
                    <button type="button" onClick={onBack}>
                        Назад
                    </button>
                </div>
                <div className="replays-empty replay-playback-empty">
                    Для этого матча нет данных для восстановления мира по журналу действий. История матча доступна в
                    разделе «История матчей».
                </div>
            </div>
        );
    }

    const snap = builtFrames[Math.min(displayFrame, builtFrames.length - 1)]?.world as
        | GameWorldSnapshot
        | undefined;
    const tickLabel = builtFrames[Math.min(displayFrame, builtFrames.length - 1)]?.tick;

    return (
        <div className="replay-playback-screen">
            <canvas ref={canvasRef} className="replay-playback-canvas" />
            <div className="replay-playback-hud">
                <div className="replay-playback-info">
                    <strong>{meta.title}</strong>
                    <span>
                        Кадр {displayFrame + 1}/{builtFrames.length} · тик {tickLabel ?? '—'} · событий:{' '}
                        {totalReplayEvents} ·
                        вводов: {totalReplayActions}
                    </span>
                </div>
                <div className="replay-playback-controls">
                    <button type="button" onClick={() => setPlaying((p) => !p)}>
                        {playing ? 'Пауза' : 'Играть'}
                    </button>
                    <button type="button" onClick={() => stepReplayFrame(-1)}>
                        ‹
                    </button>
                    <button type="button" onClick={() => stepReplayFrame(1)}>
                        ›
                    </button>
                    <button type="button" onClick={onBack}>
                        Выход
                    </button>
                </div>
            </div>
            {snap && (
                <div className="replay-playback-stats">
                    Уровень {snap.currentLevel ?? 1} · ключи {snap.keysCollected ?? 0}
                </div>
            )}
        </div>
    );
};

export default ReplayPlaybackScreen;
