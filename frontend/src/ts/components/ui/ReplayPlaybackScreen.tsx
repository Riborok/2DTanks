import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { OnlineGameRenderer } from '../../online/OnlineGameRenderer';
import type { GameWorldSnapshot, ServerTank } from '../../online/types';
import { tankVisualFromSnapshot } from '../../online/tankVisualFromSnapshot';
import { ResolutionManager } from '../../constants/gameConstants';
import { ImagePreloader } from '../../utils/ImagePreloader';
import { useSettings } from '../../context/SettingsContext';
import { SoundManager, spatial } from '../../utils/SoundManager';
import {
    hitMetalPlaybackRateForBulletType,
    shotSfxIdForBulletType,
    wallHitPlaybackRateForBulletType
} from '../../utils/bulletAudio';
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
    playerNames?: Record<string, string>;
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

/** Мультипликаторы скорости: отрицательные = реверс воспроизведения. */
const PLAYBACK_SPEEDS: number[] = [-2, -1, -0.5, 0.25, 0.5, 1, 2, 4, 8];

function formatClock(seconds: number): string {
    const s = Math.max(0, Math.floor(seconds));
    const mm = Math.floor(s / 60);
    const ss = s % 60;
    return `${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;
}

function formatSpeedLabel(speed: number): string {
    if (Math.abs(speed) === 1) {
        return speed < 0 ? '−1×' : '1×';
    }
    const abs = Math.abs(speed);
    const label = Number.isInteger(abs) ? `${abs}×` : `${abs}×`;
    return speed < 0 ? `−${label}` : label;
}

const ReplayPlaybackScreen: React.FC<ReplayPlaybackScreenProps> = ({
    meta,
    startMeta,
    actions,
    events = [],
    playerNames = {},
    onBack
}) => {
    const builtFrames = useMemo(() => {
        try {
            return buildReplayFramesClient({
                startMeta,
                actions,
                events,
                durationTicks: meta.durationTicks
            });
        } catch (e) {
            console.error('[replay] buildReplayFramesClient', e);
            return [];
        }
    }, [meta.replayId, meta.durationTicks, startMeta, actions, events]);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rendererRef = useRef<OnlineGameRenderer | null>(null);
    const snapshotRef = useRef<GameWorldSnapshot | null>(null);
    const framesRef = useRef(builtFrames);
    framesRef.current = builtFrames;

    const playingRef = useRef(true);
    const speedRef = useRef(1);
    const replayPositionFrameRef = useRef(0);
    const lastRafTimeRef = useRef(0);
    const lastDisplayFrameRef = useRef(-1);
    /** Последний индекс ключевого кадра — чтобы взрывы/импакты сработали один раз на кадр записи. */
    const replayKeyframeIdxRef = useRef(-1);
    /** Последний keyframe-индекс, при котором обновлялись процедурные следы. -1 = начальное состояние. */
    const lastKeyframeForTracksRef = useRef(-1);
    /** Дедуп one-shot аудио-эффектов в реплее; очищаем при seek/jump/backward. */
    const replayAudioOneShotKeysRef = useRef<Set<string>>(new Set());

    const [imagesLoaded, setImagesLoaded] = useState(false);
    const [playing, setPlaying] = useState(true);
    const [displayFrame, setDisplayFrame] = useState(0);
    const [speed, setSpeed] = useState(1);

    const resetReplayOneShotState = useCallback(() => {
        replayAudioOneShotKeysRef.current.clear();
        rendererRef.current?.resetOneShotEffectsState();
    }, []);

    // Free-cam (пан+зум поверх canvas через CSS transform).
    // Это чисто визуальное преобразование, не влияющее на данные кадра, чтобы не
    // ломать логику и интерполяцию рендерера. Для повышенного зума картинка
    // становится мягче — браузерный linear interpolation. Для целей "рассмотреть
    // эпизод" этого достаточно.
    const [freeCam, setFreeCam] = useState(false);
    const [camX, setCamX] = useState(0);
    const [camY, setCamY] = useState(0);
    const [camZoom, setCamZoom] = useState(1);

    const { settings } = useSettings();

    const frameMs = useMemo(() => {
        const hz = startMeta.tickRate > 0 ? startMeta.tickRate : 60;
        return (1000 / hz) * STORED_FRAME_STEP_TICKS;
    }, [startMeta.tickRate]);

    const frameMsRef = useRef(frameMs);
    frameMsRef.current = frameMs;

    const totalReplayActions = actions.length;
    const totalReplayEvents = events.length;
    const totalFrames = builtFrames.length;

    /** Длительность матча из симулированных кадров (а не durationTicks из меты, иногда null). */
    const totalDurationSec = useMemo(() => {
        if (totalFrames <= 1) {
            return 0;
        }
        return ((totalFrames - 1) * frameMs) / 1000;
    }, [frameMs, totalFrames]);

    useEffect(() => {
        playingRef.current = playing;
        if (playing) {
            lastRafTimeRef.current = performance.now();
        }
    }, [playing]);

    useEffect(() => {
        speedRef.current = speed;
    }, [speed]);

    useEffect(() => {
        SoundManager.setVolumes(settings.audio);
    }, [settings.audio]);

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
        lastKeyframeForTracksRef.current = -1;
        resetReplayOneShotState();
        setDisplayFrame(0);
        setPlaying(true);
        playingRef.current = true;
        setSpeed(1);
        speedRef.current = 1;
    }, [meta.replayId, resetReplayOneShotState]);

    const bumpDisplayFromPosition = useCallback(() => {
        const maxIdx = Math.max(0, framesRef.current.length - 1);
        const idx = Math.max(0, Math.min(maxIdx, Math.floor(replayPositionFrameRef.current)));
        if (idx !== lastDisplayFrameRef.current) {
            lastDisplayFrameRef.current = idx;
            setDisplayFrame(idx);
        }
    }, []);

    const seekBySeconds = useCallback(
        (seconds: number) => {
            const list = framesRef.current;
            const span = Math.max(0, list.length - 1);
            if (span === 0) {
                return;
            }
            const deltaFrames = (seconds * 1000) / frameMs;
            replayPositionFrameRef.current = Math.max(
                0,
                Math.min(span, replayPositionFrameRef.current + deltaFrames)
            );
            replayKeyframeIdxRef.current = -1;
            lastKeyframeForTracksRef.current = -1;
            resetReplayOneShotState();
            bumpDisplayFromPosition();
        },
        [bumpDisplayFromPosition, frameMs, resetReplayOneShotState]
    );

    const stepReplayFrame = useCallback((delta: -1 | 1) => {
        setPlaying(false);
        const list = framesRef.current;
        const span = Math.max(0, list.length - 1);
        replayPositionFrameRef.current = Math.max(
            0,
            Math.min(span, replayPositionFrameRef.current + delta)
        );
        replayKeyframeIdxRef.current = -1;
        lastKeyframeForTracksRef.current = -1;
        resetReplayOneShotState();
        bumpDisplayFromPosition();
    }, [bumpDisplayFromPosition, resetReplayOneShotState]);

    const handleScrubChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const list = framesRef.current;
            const span = Math.max(0, list.length - 1);
            const next = Math.max(0, Math.min(span, parseInt(e.target.value, 10) || 0));
            replayPositionFrameRef.current = next;
            replayKeyframeIdxRef.current = -1;
            lastKeyframeForTracksRef.current = -1;
            resetReplayOneShotState();
            bumpDisplayFromPosition();
        },
        [bumpDisplayFromPosition, resetReplayOneShotState]
    );

    const handleRestart = useCallback(() => {
        replayPositionFrameRef.current = 0;
        replayKeyframeIdxRef.current = -1;
        lastKeyframeForTracksRef.current = -1;
        resetReplayOneShotState();
        bumpDisplayFromPosition();
        setPlaying(true);
    }, [bumpDisplayFromPosition, resetReplayOneShotState]);

    // Клавиатурные шорткаты: пробел — пауза, ←/→ — ±5с, Shift+←/→ — ±10с, J/K/L — YouTube-style.
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }
            switch (e.key) {
                case ' ':
                case 'k':
                case 'K':
                    e.preventDefault();
                    setPlaying((p) => !p);
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    seekBySeconds(e.shiftKey ? -10 : -5);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    seekBySeconds(e.shiftKey ? 10 : 5);
                    break;
                case 'j':
                case 'J':
                    e.preventDefault();
                    seekBySeconds(-10);
                    break;
                case 'l':
                case 'L':
                    e.preventDefault();
                    seekBySeconds(10);
                    break;
                case ',':
                    e.preventDefault();
                    stepReplayFrame(-1);
                    break;
                case '.':
                    e.preventDefault();
                    stepReplayFrame(1);
                    break;
                case 'Home':
                    e.preventDefault();
                    replayPositionFrameRef.current = 0;
                    replayKeyframeIdxRef.current = -1;
                    lastKeyframeForTracksRef.current = -1;
                    resetReplayOneShotState();
                    bumpDisplayFromPosition();
                    break;
                case 'End': {
                    e.preventDefault();
                    const span = Math.max(0, framesRef.current.length - 1);
                    replayPositionFrameRef.current = span;
                    replayKeyframeIdxRef.current = -1;
                    lastKeyframeForTracksRef.current = -1;
                    resetReplayOneShotState();
                    bumpDisplayFromPosition();
                    break;
                }
                default:
                    break;
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [bumpDisplayFromPosition, resetReplayOneShotState, seekBySeconds, stepReplayFrame]);

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
        renderer.setReplayMode(true);
        renderer.setPlayerLabels(new Map(Object.entries(playerNames)));
        rendererRef.current = renderer;

        const initial = (framesRef.current[0]?.world as GameWorldSnapshot | undefined) ?? null;
        if (initial) {
            applyTankConfigs(renderer, initial);
            snapshotRef.current = initial;
            lastDisplayFrameRef.current = 0;
            replayKeyframeIdxRef.current = -1;
            lastKeyframeForTracksRef.current = -1;
            renderer.updateFromSnapshot(initial);
            const flist = framesRef.current;
            if (flist.length > 0) {
                renderer.syncReplayTireTracksToKeyframe(flist, 0, -1);
                lastKeyframeForTracksRef.current = 0;
            }
            setDisplayFrame(0);
        }

        const handleResize = () => {
            const newSize = resizeCanvas();
            rendererRef.current?.clear();
            rendererRef.current = new OnlineGameRenderer(ctx, newSize);
            rendererRef.current.setReplayMode(true);
            rendererRef.current.setPlayerLabels(new Map(Object.entries(playerNames)));
            lastKeyframeForTracksRef.current = -1;
            const snap = snapshotRef.current;
            if (snap) {
                applyTankConfigs(rendererRef.current, snap);
                rendererRef.current.updateFromSnapshot(snap);
                const flist = framesRef.current;
                const idx = Math.max(0, Math.min(flist.length - 1, Math.floor(replayPositionFrameRef.current)));
                if (flist.length > 0) {
                    rendererRef.current.syncReplayTireTracksToKeyframe(flist, idx, -1);
                    lastKeyframeForTracksRef.current = idx;
                }
            }
        };

        window.addEventListener('resize', handleResize);

        let raf = 0;
        const loop = () => {
            try {
                const flist = framesRef.current;
                const span = Math.max(0, flist.length - 1);
                const now = performance.now();
                if (lastRafTimeRef.current === 0) {
                    lastRafTimeRef.current = now;
                }
                const dt = now - lastRafTimeRef.current;
                lastRafTimeRef.current = now;

                if (playingRef.current && span > 0) {
                    replayPositionFrameRef.current += (dt / frameMs) * speedRef.current;
                    // Не зацикливаем: на концах останавливаемся. Пользователь видит, когда матч закончился.
                    if (replayPositionFrameRef.current >= span) {
                        replayPositionFrameRef.current = span;
                        playingRef.current = false;
                        setPlaying(false);
                    } else if (replayPositionFrameRef.current <= 0) {
                        replayPositionFrameRef.current = 0;
                        playingRef.current = false;
                        setPlaying(false);
                    }
                }

                if (flist.length > 0) {
                    const spanIdx = Math.max(0, flist.length - 1);
                    const idx = Math.max(0, Math.min(spanIdx, Math.floor(replayPositionFrameRef.current)));
                    const alpha = replayPositionFrameRef.current - idx;
                    const wA = flist[idx].world as GameWorldSnapshot;
                    const wB = flist[Math.min(idx + 1, spanIdx)].world as GameWorldSnapshot;
                    const merged = interpolateReplaySnapshots(wA, wB, alpha);

                    const prevTrackKeyframe = lastKeyframeForTracksRef.current;
                    const isReversing = prevTrackKeyframe >= 0 && (idx < prevTrackKeyframe || speedRef.current < 0);
                    if (rendererRef.current) {
                        rendererRef.current.setReversing(isReversing);
                    }
                    if (prevTrackKeyframe >= 0 && (isReversing || Math.abs(idx - prevTrackKeyframe) > 1)) {
                        resetReplayOneShotState();
                    }
                    if (idx !== prevTrackKeyframe && rendererRef.current) {
                        rendererRef.current.syncReplayTireTracksToKeyframe(flist, idx, prevTrackKeyframe);
                        lastKeyframeForTracksRef.current = idx;
                    }

                    if (idx !== replayKeyframeIdxRef.current) {
                        // Эффекты (взрывы/импакты) проигрываем только при движении вперёд.
                        const forward = idx > replayKeyframeIdxRef.current;
                        replayKeyframeIdxRef.current = idx;
                        if (forward) {
                            const landed = flist[idx].world as GameWorldSnapshot;
                            const prevLanded = idx > 0 ? (flist[idx - 1].world as GameWorldSnapshot) : null;
                            const playSpatial = (
                                id: Parameters<typeof SoundManager.play>[0],
                                x: number,
                                y: number,
                                maxDist: number,
                                extra?: { playbackRate?: number }
                            ) => {
                                const s = spatial(x, y, 960, 540, 2500);
                                if (s.volume <= 0) return;
                                SoundManager.play(id, { ...s, ...extra });
                            };
                            const playOneShotSpatial = (
                                key: string,
                                id: Parameters<typeof SoundManager.play>[0],
                                x: number,
                                y: number,
                                maxDist: number,
                                extra?: { playbackRate?: number }
                            ) => {
                                if (replayAudioOneShotKeysRef.current.has(key)) {
                                    return;
                                }
                                replayAudioOneShotKeysRef.current.add(key);
                                if (replayAudioOneShotKeysRef.current.size > 2048) {
                                    replayAudioOneShotKeysRef.current.clear();
                                }
                                playSpatial(id, x, y, maxDist, extra);
                            };
                            // Новые пули на ключевом кадре = выстрелы.
                            const prevBulletIds = new Set((prevLanded?.bullets ?? []).map((b) => b.id));
                            for (const b of landed.bullets ?? []) {
                                if (prevBulletIds.has(b.id)) continue;
                                playSpatial(shotSfxIdForBulletType(b.type), b.x, b.y, 1700);
                            }
                            // Разрушение ящиков между keyframe-ами.
                            if (prevLanded?.crates) {
                                const currentCrates = new Map((landed.crates ?? []).map((c) => [c.id, c]));
                                for (const prevCrate of prevLanded.crates) {
                                    const curr = currentCrates.get(prevCrate.id);
                                    if (!curr || (prevCrate.hp > 0 && curr.hp <= 0)) {
                                        playSpatial('game:crateBreak', prevCrate.x, prevCrate.y, 1500);
                                    }
                                }
                            }
                            merged.explosions = landed.explosions ? [...landed.explosions] : [];
                            merged.grenadeExplosions = landed.grenadeExplosions
                                ? [...landed.grenadeExplosions]
                                : [];
                            merged.bulletImpacts = landed.bulletImpacts ? [...landed.bulletImpacts] : [];
                            merged.hullCollisions = landed.hullCollisions ? [...landed.hullCollisions] : [];
                            for (const ex of merged.explosions) {
                                const key = `exp|${Math.round(ex.x)}|${Math.round(ex.y)}|${Number(ex.angle || 0).toFixed(4)}`;
                                playOneShotSpatial(key, 'game:explosion', ex.x, ex.y, 1600);
                            }
                            for (const ex of merged.grenadeExplosions) {
                                const key =
                                    `gren|${Math.round(ex.x)}|${Math.round(ex.y)}|` +
                                    `${Number(ex.angle || 0).toFixed(4)}|${Math.round(ex.size ?? 0)}`;
                                playOneShotSpatial(key, 'game:explosion', ex.x, ex.y, 1500);
                            }
                            const HIT_RADIUS = 70;
                            for (const im of merged.bulletImpacts) {
                                let hitTank = false;
                                for (const t of landed.tanks ?? []) {
                                    if (Math.hypot(t.x - im.x, t.y - im.y) < HIT_RADIUS) {
                                        hitTank = true;
                                        break;
                                    }
                                }
                                if (hitTank) {
                                    const key = `hit|${Math.round(im.x)}|${Math.round(im.y)}|${im.bulletType}`;
                                    playOneShotSpatial(key, 'game:hit', im.x, im.y, 1400, {
                                        playbackRate: hitMetalPlaybackRateForBulletType(im.bulletType)
                                    });
                                } else {
                                    const key = `wall|${Math.round(im.x)}|${Math.round(im.y)}|${im.bulletType}`;
                                    playOneShotSpatial(key, 'game:wallHit', im.x, im.y, 1400, {
                                        playbackRate: wallHitPlaybackRateForBulletType(im.bulletType)
                                    });
                                }
                            }
                            for (const hc of merged.hullCollisions) {
                                const key = `coll|${Math.round(hc.x)}|${Math.round(hc.y)}|${hc.playerId || ''}`;
                                playOneShotSpatial(key, 'game:collision', hc.x, hc.y, 1300);
                            }
                        } else {
                            merged.explosions = [];
                            merged.grenadeExplosions = [];
                            merged.bulletImpacts = [];
                            merged.hullCollisions = [];
                        }
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
                    rendererRef.current.setReplayPlaybackClock(
                        replayPositionFrameRef.current,
                        frameMsRef.current
                    );
                    rendererRef.current.render();
                }
            } catch (err) {
                // Не даем ошибке оборвать RAF-цепочку: иначе replay «замирает» без видимой причины.
                console.error('[replay] loop error', err);
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
    }, [frameMs, imagesLoaded, meta.replayId, builtFrames, playerNames]);

    // Применяем CSS-трансформацию к canvas при включённом free-cam.
    useEffect(() => {
        const c = canvasRef.current;
        if (!c) return;
        if (!freeCam) {
            c.style.transform = '';
            c.style.transformOrigin = '';
            return;
        }
        c.style.transformOrigin = '50% 50%';
        c.style.transform = `translate(${camX}px, ${camY}px) scale(${camZoom})`;
    }, [freeCam, camX, camY, camZoom]);

    // Mouse drag + wheel zoom для free-cam.
    useEffect(() => {
        const c = canvasRef.current;
        if (!c || !freeCam) return;

        let dragging = false;
        let lastX = 0;
        let lastY = 0;

        const onDown = (e: MouseEvent) => {
            dragging = true;
            lastX = e.clientX;
            lastY = e.clientY;
        };
        const onMove = (e: MouseEvent) => {
            if (!dragging) return;
            const dx = e.clientX - lastX;
            const dy = e.clientY - lastY;
            lastX = e.clientX;
            lastY = e.clientY;
            setCamX((v) => v + dx);
            setCamY((v) => v + dy);
        };
        const onUp = () => {
            dragging = false;
        };
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const delta = -e.deltaY * 0.0015;
            setCamZoom((z) => Math.max(0.4, Math.min(5, z * (1 + delta))));
        };

        c.addEventListener('mousedown', onDown);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        c.addEventListener('wheel', onWheel, { passive: false });
        return () => {
            c.removeEventListener('mousedown', onDown);
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
            c.removeEventListener('wheel', onWheel as any);
        };
    }, [freeCam]);

    const resetCam = useCallback(() => {
        setCamX(0);
        setCamY(0);
        setCamZoom(1);
    }, []);

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

    const clampedFrame = Math.min(displayFrame, builtFrames.length - 1);
    const snap = builtFrames[clampedFrame]?.world as GameWorldSnapshot | undefined;
    const tickLabel = builtFrames[clampedFrame]?.tick;
    const elapsedSec = (clampedFrame * frameMs) / 1000;
    const atEnd = clampedFrame >= builtFrames.length - 1;

    const mode: 'standard' | 'deathmatch' = snap?.gameMode === 'deathmatch' ? 'deathmatch' : 'standard';
    let timerPrimary: string;
    let timerSecondary: string;
    if (mode === 'deathmatch') {
        const totalDm = snap?.deathmatchDurationSec ?? totalDurationSec;
        const remaining = Math.max(0, (totalDm ?? 0) - elapsedSec);
        timerPrimary = `Осталось ${formatClock(remaining)}`;
        timerSecondary = `${formatClock(elapsedSec)} / ${formatClock(totalDm ?? totalDurationSec)}`;
    } else {
        const limit = snap?.standardTimeLimitSec ?? null;
        if (limit && limit > 0) {
            const remaining = Math.max(0, limit - elapsedSec);
            timerPrimary = `Осталось ${formatClock(remaining)}`;
            timerSecondary = `${formatClock(elapsedSec)} / ${formatClock(limit)}`;
        } else {
            timerPrimary = formatClock(elapsedSec);
            timerSecondary = `из ${formatClock(totalDurationSec)}`;
        }
    }

    return (
        <div className="replay-playback-screen">
            <canvas ref={canvasRef} className="replay-playback-canvas" />
            <div className="replay-playback-hud">
                <div className="replay-playback-info">
                    <strong>{meta.title}</strong>
                    <span>
                        Кадр {clampedFrame + 1}/{builtFrames.length} · тик {tickLabel ?? '—'} · событий:{' '}
                        {totalReplayEvents} · вводов: {totalReplayActions}
                    </span>
                </div>
                <div className="replay-playback-timer">
                    <span className="replay-playback-timer-primary">{timerPrimary}</span>
                    <span className="replay-playback-timer-secondary">{timerSecondary}</span>
                </div>
                <div className="replay-playback-controls">
                    <button type="button" onClick={onBack}>
                        Выход
                    </button>
                </div>
            </div>

            {snap && (
                <div className="replay-playback-stats">
                    {mode === 'deathmatch' ? (
                        <>Арена · режим: бой на киллы</>
                    ) : (
                        <>Уровень {snap.currentLevel ?? 1} · ключи {snap.keysCollected ?? 0}</>
                    )}
                </div>
            )}

            <div className="replay-playback-bottombar">
                <input
                    className="replay-playback-scrub"
                    type="range"
                    min={0}
                    max={Math.max(0, builtFrames.length - 1)}
                    value={clampedFrame}
                    onChange={handleScrubChange}
                    step={1}
                    aria-label="Позиция воспроизведения"
                />

                <div className="replay-playback-controls-row">
                    <button
                        type="button"
                        onClick={() => seekBySeconds(-10)}
                        title="−10 секунд (J или Shift+←)"
                    >
                        «« 10с
                    </button>
                    <button
                        type="button"
                        onClick={() => seekBySeconds(-5)}
                        title="−5 секунд (←)"
                    >
                        « 5с
                    </button>
                    <button
                        type="button"
                        onClick={() => stepReplayFrame(-1)}
                        title="Предыдущий кадр (,)"
                    >
                        ‹
                    </button>
                    {atEnd ? (
                        <button
                            type="button"
                            className="replay-playback-play"
                            onClick={handleRestart}
                            title="Смотреть заново"
                        >
                            ⟲ В начало
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="replay-playback-play"
                            onClick={() => setPlaying((p) => !p)}
                            title="Пауза/воспроизведение (пробел или K)"
                        >
                            {playing ? '❚❚ Пауза' : '▶ Играть'}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => stepReplayFrame(1)}
                        title="Следующий кадр (.)"
                    >
                        ›
                    </button>
                    <button
                        type="button"
                        onClick={() => seekBySeconds(5)}
                        title="+5 секунд (→)"
                    >
                        5с »
                    </button>
                    <button
                        type="button"
                        onClick={() => seekBySeconds(10)}
                        title="+10 секунд (L или Shift+→)"
                    >
                        10с »»
                    </button>

                    <div className="replay-playback-speed" role="group" aria-label="Скорость воспроизведения">
                        {PLAYBACK_SPEEDS.map((s) => (
                            <button
                                key={s}
                                type="button"
                                className={speed === s ? 'active' : ''}
                                onClick={() => setSpeed(s)}
                                title={
                                    s < 0
                                        ? `Обратное воспроизведение ${Math.abs(s)}×`
                                        : `Скорость ${s}×`
                                }
                            >
                                {formatSpeedLabel(s)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="replay-playback-controls-row replay-playback-controls-row--extras">
                    <button
                        type="button"
                        className={freeCam ? 'active' : ''}
                        onClick={() => setFreeCam((v) => !v)}
                        title="Free-cam: свободное перемещение и зум мыши"
                    >
                        {freeCam ? '🎥 Free-cam: on' : '🎥 Free-cam: off'}
                    </button>
                    {freeCam && (
                        <>
                            <button type="button" onClick={() => setCamZoom((z) => Math.min(5, z * 1.2))} title="Увеличить">
                                +
                            </button>
                            <button type="button" onClick={() => setCamZoom((z) => Math.max(0.4, z / 1.2))} title="Уменьшить">
                                −
                            </button>
                            <button type="button" onClick={resetCam} title="Сбросить положение камеры">
                                ⟲ Камера
                            </button>
                            <span className="replay-playback-zoom-label">{(camZoom * 100).toFixed(0)}%</span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReplayPlaybackScreen;
