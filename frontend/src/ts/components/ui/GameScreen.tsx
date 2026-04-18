import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { WebSocketClient } from '../../online/WebSocketClient';
import { OnlineGameRenderer } from '../../online/OnlineGameRenderer';
import { GameWorldSnapshot } from '../../online/types';
import { Size } from '../../additionally/type';
import { ResolutionManager } from '../../constants/gameConstants';
import { VK_W, VK_S, VK_A, VK_D, VK_Q, VK_E, VK_SPACE } from '../../constants/keyCodes';
import {
    actionToVk,
    findActionForKeyCode,
    GAME_CONTROL_VK_CODES
} from '../../utils/keyBindings';
import { ImagePreloader } from '../../utils/ImagePreloader';
import type { DeathmatchScoreRow, PlayerMatchStatsRow } from './GameEndScreen';
import TouchJoystick from './TouchJoystick';
import { useSettings } from '../../context/SettingsContext';
import { SoundManager, spatial } from '../../utils/SoundManager';
import { useHudEvents } from '../hud/useHudEvents';
import KillFeed from '../hud/KillFeed';
import DamageNumbers from '../hud/DamageNumbers';
import DamageDirection from '../hud/DamageDirection';
import Minimap from '../hud/Minimap';
import FullscreenToggle from '../hud/FullscreenToggle';
import PingWheel, { PingType } from '../hud/PingWheel';

const REQUIRED_KEYS_PER_LEVEL = 1;

function buildAction(pressedKeys: Set<number>, includeShoot: boolean = false) {
    return {
        forward: pressedKeys.has(VK_W),
        backward: pressedKeys.has(VK_S),
        turnLeft: pressedKeys.has(VK_A),
        turnRight: pressedKeys.has(VK_D),
        turretLeft: pressedKeys.has(VK_Q),
        turretRight: pressedKeys.has(VK_E),
        shoot: includeShoot && pressedKeys.has(VK_SPACE)
    };
}

interface GameScreenProps {
    wsClient: WebSocketClient;
    myPlayerId: string;
    myRole: 'attacker' | 'defender' | 'fighter';
    myTankConfig: any;
    players: Array<{
        playerId: string;
        role: 'attacker' | 'defender' | 'fighter';
        tankConfig?: any;
        ready?: boolean;
        displayName?: string;
    }>;
    isDeathmatch?: boolean;
    onGameEnd: (
        result:
            | {
                  mode: 'standard';
                  winner: 'attacker' | 'defender';
                  reason: string;
                  stats: PlayerMatchStatsRow[];
              }
            | {
                  mode: 'deathmatch';
                  reason: string;
                  scores: DeathmatchScoreRow[];
                  winnerPlayerIds: string[];
                  stats: PlayerMatchStatsRow[];
              }
    ) => void;
    onDisconnect: () => void;
    onLeaveGame: () => void;
}

const GameScreen: React.FC<GameScreenProps> = ({
    wsClient,
    myPlayerId,
    myRole,
    myTankConfig,
    players,
    isDeathmatch = false,
    onGameEnd,
    onDisconnect,
    onLeaveGame
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rendererRef = useRef<OnlineGameRenderer | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const snapshotRef = useRef<GameWorldSnapshot | null>(null);
    const tankConfigsRef = useRef<Map<string, { hullNum: number; trackNum: number; turretNum: number; weaponNum: number; color: number }>>(new Map());
    const menuRef = useRef<HTMLDivElement>(null); // Ref for the game UI menu
    
    const [keysPressed, setKeysPressed] = useState<Set<number>>(new Set());
    const keysPressedRef = useRef<Set<number>>(new Set());
    const shootSentRef = useRef<boolean>(false); // Track if shoot was already sent
    const touchBridgeRef = useRef<{
        keyDown: (code: number) => void;
        keyUp: (code: number) => void;
        fire: () => void;
    }>({
        keyDown: () => {},
        keyUp: () => {},
        fire: () => {}
    });
    const [useTouchUi, setUseTouchUi] = useState(false);
    const { settings } = useSettings();
    const settingsRef = useRef(settings);
    settingsRef.current = settings;
    const [pingWheelOpen, setPingWheelOpen] = useState(false);
    const [worldPings, setWorldPings] = useState<
        Array<{ id: number; x: number; y: number; type: PingType; createdAt: number; fromName: string }>
    >([]);
    /** null: нет лимита (практика/соло) или ещё не пришёл снимок; иначе секунды до конца */
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
    const [myKills, setMyKills] = useState(0);
    const [keysCollected, setKeysCollected] = useState<number>(0);
    const [currentLevel, setCurrentLevel] = useState<number>(1);
    const [imagesLoaded, setImagesLoaded] = useState<boolean>(false);
    const [loadingProgress, setLoadingProgress] = useState<{ loaded: number; total: number }>({ loaded: 0, total: 0 });
    const [loadingStage, setLoadingStage] = useState<string>('Загрузка ресурсов...');


            // Preload all images when component mounts
            useEffect(() => {
                setLoadingStage('Загрузка изображений...');

                // Set up progress callback
                ImagePreloader.setProgressCallback((loaded, total) => {
                    setLoadingProgress({ loaded, total });
                });

                ImagePreloader.preloadAll()
                    .then(() => {
                        setLoadingStage('Подготовка игры...');
                        // Small delay to show "Preparing game" message
                        setTimeout(() => {
                            setImagesLoaded(true);
                        }, 200);
                    })
                    .catch((error) => {
                        // Continue anyway - images will load on demand
                        setImagesLoaded(true);
                    });
            }, []);

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 900px), (pointer: coarse)');
        const apply = () => setUseTouchUi(mq.matches);
        apply();
        mq.addEventListener('change', apply);
        return () => mq.removeEventListener('change', apply);
    }, []);

    // Прокидываем уровни громкости из настроек в звуковой менеджер
    useEffect(() => {
        SoundManager.setVolumes(settings.audio);
    }, [settings.audio]);

    // Слушатель пингов с сервера
    useEffect(() => {
        const handler = (message: any) => {
            if (!message || message.type !== 'ping:msg') return;
            const fromName =
                players.find((p) => p.playerId === message.fromId)?.displayName?.slice(0, 12) || 'Игрок';
            setWorldPings((prev) => [
                ...prev,
                {
                    id: Math.random(),
                    x: Number(message.x),
                    y: Number(message.y),
                    type: message.pingType as PingType,
                    createdAt: performance.now(),
                    fromName
                }
            ]);
            SoundManager.play('ui:click');
        };
        wsClient.on('ping:msg' as any, handler);
        return () => wsClient.off('ping:msg' as any, handler);
    }, [wsClient, players]);

    // Периодическая чистка старых world-пингов
    useEffect(() => {
        const t = window.setInterval(() => {
            setWorldPings((prev) => {
                const now = performance.now();
                const next = prev.filter((p) => now - p.createdAt < 3000);
                return next.length === prev.length ? prev : next;
            });
        }, 500);
        return () => window.clearInterval(t);
    }, []);

    // Карта playerId → displayName для kill-feed и пингов
    const playerNameById = useMemo(() => {
        const m = new Map<string, string>();
        for (const p of players) {
            m.set(p.playerId, (p.displayName || p.playerId).slice(0, 16));
        }
        return m;
    }, [players]);

    // События HUD (kill-feed, damage numbers, damage direction, sfx/haptics)
    const hud = useHudEvents(snapshotRef, {
        myPlayerId,
        playerNameById,
        onNewExplosion: (x, y) => {
            const snap = snapshotRef.current;
            const me = snap?.tanks.find((t) => t.playerId === myPlayerId);
            if (me) {
                const s = spatial(x, y, me.x, me.y, 1600);
                SoundManager.play('game:explosion', s);
            } else {
                SoundManager.play('game:explosion');
            }
        },
        onNewBulletImpact: (x, y) => {
            const snap = snapshotRef.current;
            const me = snap?.tanks.find((t) => t.playerId === myPlayerId);
            if (me) {
                const s = spatial(x, y, me.x, me.y, 1400);
                SoundManager.play('game:hit', s);
            } else {
                SoundManager.play('game:hit');
            }
        },
        onOwnShot: () => {
            SoundManager.play('game:shot');
            if (settingsRef.current.mobile.haptics) {
                try {
                    navigator.vibrate?.(15);
                } catch {
                    /* ignore */
                }
            }
        },
        onOwnDamage: () => {
            SoundManager.play('game:damageTaken');
            if (settingsRef.current.mobile.haptics) {
                try {
                    navigator.vibrate?.([0, 45]);
                } catch {
                    /* ignore */
                }
            }
        },
        onTankKilled: (tank) => {
            SoundManager.play('game:kill');
            if (tank.playerId === myPlayerId && settingsRef.current.mobile.haptics) {
                try {
                    navigator.vibrate?.([0, 80, 40, 80]);
                } catch {
                    /* ignore */
                }
            }
        }
    });

    useEffect(() => {
        if (!canvasRef.current || !imagesLoaded) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Function to resize canvas to fit full window - menu is overlay on top
        const resizeCanvas = () => {
            // Canvas occupies full window - menu is an overlay on top
            const canvasWidth = window.innerWidth;
            const canvasHeight = window.innerHeight;
            
            // Set canvas internal size to match window size
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;

            // Set canvas CSS styles explicitly to override CSS class styles
            canvas.style.width = canvasWidth + 'px';
            canvas.style.height = canvasHeight + 'px';
            canvas.style.top = '0px';
            canvas.style.left = '0px';
            canvas.style.position = 'absolute';

            // Масштаб: вписать мир 1920×1080 в холст без обрезки (letterbox)
            ResolutionManager.setViewport(canvas.width, canvas.height);
            
            return { width: canvas.width, height: canvas.height };
        };

        // Initial resize - wait for DOM to be fully rendered
        requestAnimationFrame(() => {
            // First resize - set canvas size and ResolutionManager
            const size = resizeCanvas();
            
            // Create renderer with calculated size (ResolutionManager is now configured)
            const renderer = new OnlineGameRenderer(ctx, size);
            rendererRef.current = renderer;
        });

        // Handle window resize
        const handleResize = () => {
            const newSize = resizeCanvas();
            // Recreate renderer with new size (renderer holds canvas reference which needs to be updated)
            if (rendererRef.current) {
                // Clear old renderer
                rendererRef.current.clear();
                
                // Recreate renderer with new canvas size
                rendererRef.current = new OnlineGameRenderer(ctx, newSize);
                
                // Restore tank configs from saved ref
                for (const [tankId, config] of tankConfigsRef.current) {
                    rendererRef.current.setTankConfig(tankId, config);
                }
                
                // Trigger snapshot update to restore all sprites with new size
                if (snapshotRef.current) {
                    rendererRef.current.updateFromSnapshot(snapshotRef.current);
                }
            }
        };
        
        window.addEventListener('resize', handleResize);

        // Setup tank configs from players (will be updated when snapshot arrives)
        // This effect is handled in handleSnapshot
        
        // Setup WebSocket listeners
        const handleSnapshot = (message: any) => {
            if (message.world) {
                snapshotRef.current = message.world;

                // Update UI state from snapshot - update always to ensure React re-renders
                const world = message.world;
                const dm = world.gameMode === 'deathmatch' || isDeathmatch;
                if (dm) {
                    const dur =
                        typeof world.deathmatchDurationSec === 'number' && world.deathmatchDurationSec > 0
                            ? world.deathmatchDurationSec
                            : 60;
                    const rem =
                        typeof world.deathmatchRemainingSec === 'number'
                            ? world.deathmatchRemainingSec
                            : Math.max(0, dur - (world.timeElapsed || 0));
                    setTimeRemaining(Math.max(0, rem));
                    const ks = world.killScores as Record<string, number> | undefined;
                    if (ks && myPlayerId) {
                        setMyKills(ks[myPlayerId] ?? 0);
                    }
                } else {
                    const lim = world.standardTimeLimitSec;
                    if (lim === null) {
                        setTimeRemaining(null);
                    } else if (typeof lim === 'number' && Number.isFinite(lim)) {
                        setTimeRemaining(Math.max(0, lim - (world.timeElapsed || 0)));
                    } else {
                        setTimeRemaining(Math.max(0, 300 - (world.timeElapsed || 0)));
                    }
                }
                // Explicitly handle keysCollected - ensure it's a number
                const keys = typeof world.keysCollected === 'number' ? world.keysCollected : 0;
                setKeysCollected(keys);
                setCurrentLevel(world.currentLevel || 1);
                
                // Update tank configs when snapshot arrives
                if (rendererRef.current) {
                    const labels = new Map<string, string>();
                    for (const player of players) {
                        if (player.playerId) {
                            labels.set(player.playerId, player.displayName || player.playerId.slice(0, 12));
                        }
                    }
                    rendererRef.current.setPlayerLabels(labels);
                    for (const player of players) {
                        if (player.tankConfig) {
                            const tank = message.world.tanks?.find((t: any) => t.playerId === player.playerId);
                            if (tank) {
                                rendererRef.current.setTankConfig(tank.id, player.tankConfig);
                                // Save config to ref for resize recovery
                                tankConfigsRef.current.set(tank.id, player.tankConfig);
                            }
                        }
                    }
                }
            }
        };

        const handleGameEnd = (message: any) => {
            const stats: PlayerMatchStatsRow[] = Array.isArray(message.stats)
                ? message.stats.map((s: any) => ({
                      playerId: String(s.playerId),
                      role:
                          s.role === 'attacker' || s.role === 'defender' || s.role === 'fighter'
                              ? s.role
                              : 'fighter',
                      kills: Number(s.kills) || 0,
                      deaths: Number(s.deaths) || 0,
                      shotsFired: Number(s.shotsFired) || 0,
                      shotsHit: Number(s.shotsHit) || 0,
                      damageDealt: Number(s.damageDealt) || 0,
                      damageTaken: Number(s.damageTaken) || 0,
                      keyPickups: Number(s.keyPickups) || 0,
                      ammoPickups: Number(s.ammoPickups) || 0
                  }))
                : [];
            if (message.deathmatch) {
                const scores: DeathmatchScoreRow[] = Array.isArray(message.scores)
                    ? message.scores.map((s: any) => ({
                          playerId: String(s.playerId),
                          kills: Number(s.kills) || 0
                      }))
                    : [];
                const winnerPlayerIds: string[] = Array.isArray(message.winnerPlayerIds)
                    ? message.winnerPlayerIds.map(String)
                    : [];
                onGameEnd({
                    mode: 'deathmatch',
                    reason: message.reason || 'gameEnd',
                    scores,
                    winnerPlayerIds,
                    stats
                });
                return;
            }
            let winnerRole: 'attacker' | 'defender';
            if (message.winner === 'attacker' || message.winner === 'defender') {
                winnerRole = message.winner;
            } else if (message.reason === 'opponentDisconnected') {
                winnerRole = myRole === 'defender' ? 'defender' : 'attacker';
            } else {
                winnerRole = 'defender';
            }
            onGameEnd({
                mode: 'standard',
                winner: winnerRole,
                reason: message.reason || 'gameEnd',
                stats
            });
        };

        const handleError = (message: any) => {
            if (message.message?.includes('disconnect')) {
                onDisconnect();
            }
        };

        wsClient.on('snapshot', handleSnapshot);
        wsClient.on('gameEnd', handleGameEnd);
        wsClient.on('error', handleError);

        const sendAction = () => {
            if (snapshotRef.current) {
                wsClient.send({ type: 'action', action: buildAction(keysPressedRef.current) });
            }
        };

        const applyKeyDown = (code: number) => {
            if (!GAME_CONTROL_VK_CODES.includes(code)) return;
            setKeysPressed(prev => {
                const newSet = new Set(prev);
                const wasPressed = newSet.has(code);
                newSet.add(code);
                keysPressedRef.current = newSet;
                if (code === VK_SPACE && !wasPressed && snapshotRef.current) {
                    shootSentRef.current = true;
                    wsClient.send({ type: 'action', action: buildAction(newSet, true) });
                }
                return newSet;
            });
        };

        const applyKeyUp = (code: number) => {
            if (!GAME_CONTROL_VK_CODES.includes(code)) return;
            if (code === VK_SPACE) {
                shootSentRef.current = false;
            }
            setKeysPressed(prev => {
                const newSet = new Set(prev);
                newSet.delete(code);
                keysPressedRef.current = newSet;
                if (newSet.size === 0) {
                    sendAction();
                }
                return newSet;
            });
        };

        const applyFirePress = () => {
            if (!snapshotRef.current) return;
            // Выстрел с touch-кнопки не зависит от состояния клавиш — shoot выставляем
            // явно. buildAction(..., true) здесь не подходит: он проверяет VK_SPACE в
            // наборе нажатых клавиш, а на мобилке Space никогда не попадает туда.
            const action = buildAction(keysPressedRef.current, false);
            action.shoot = true;
            wsClient.send({ type: 'action', action });
        };

        touchBridgeRef.current = {
            keyDown: applyKeyDown,
            keyUp: applyKeyUp,
            fire: applyFirePress
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            // V — колесо пингов на десктопе
            if (e.code === 'KeyV') {
                e.preventDefault();
                setPingWheelOpen((v) => !v);
                return;
            }
            const action = findActionForKeyCode(settingsRef.current.controls.keyBindings, e.code);
            if (!action) return;
            const vk = actionToVk(action);
            if (action === 'shoot') {
                e.preventDefault();
            }
            applyKeyDown(vk);
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            const action = findActionForKeyCode(settingsRef.current.controls.keyBindings, e.code);
            if (!action) return;
            const vk = actionToVk(action);
            if (action === 'shoot') {
                e.preventDefault();
            }
            applyKeyUp(vk);
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        // Send actions periodically while keys are pressed (like walking)
        // Send at 60Hz to match server game loop frequency for smoother movement
        // Note: shoot is handled separately on keydown, not here
        const actionSendInterval = setInterval(() => {
            if (snapshotRef.current && keysPressedRef.current.size > 0) {
                const action = buildAction(keysPressedRef.current, false); // Don't include shoot here
                wsClient.send({ type: 'action', action });
            }
        }, 16); // ~60 Hz - match server tick rate for consistent movement

        // Game loop
        const gameLoop = () => {
            if (rendererRef.current && snapshotRef.current) {
                rendererRef.current.updateFromSnapshot(snapshotRef.current);
                rendererRef.current.render();
            }
            animationFrameRef.current = requestAnimationFrame(gameLoop);
        };
        animationFrameRef.current = requestAnimationFrame(gameLoop);

        // Cleanup
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('resize', handleResize); // Remove resize listener
            clearInterval(actionSendInterval);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            wsClient.off('snapshot', handleSnapshot);
            wsClient.off('gameEnd', handleGameEnd);
            wsClient.off('error', handleError);
            if (rendererRef.current) {
                rendererRef.current.clear();
            }
        };
    }, [wsClient, myPlayerId, myRole, myTankConfig, players, isDeathmatch, onGameEnd, onDisconnect, imagesLoaded]);

    // Format time as MM:SS
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(Math.max(0, seconds) / 60);
        const secs = Math.floor(Math.max(0, seconds) % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const bindTouchKey = (code: number) => ({
        onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
            e.preventDefault();
            e.stopPropagation();
            try {
                e.currentTarget.setPointerCapture(e.pointerId);
            } catch {
                /* ignore */
            }
            touchBridgeRef.current.keyDown(code);
        },
        onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => {
            e.preventDefault();
            touchBridgeRef.current.keyUp(code);
            try {
                e.currentTarget.releasePointerCapture(e.pointerId);
            } catch {
                /* ignore */
            }
        },
        onPointerCancel: () => touchBridgeRef.current.keyUp(code),
        onLostPointerCapture: () => touchBridgeRef.current.keyUp(code)
    });

    /**
     * Hold-to-fire: пока палец прижат к кнопке «Огонь», периодически шлём событие
     * стрельбы. Сервер сам учтёт reloadSpeed (см. TankModel.shot), лишние события
     * безопасно игнорируются. Частота 120 мс заведомо чаще минимальной перезарядки,
     * но не создаёт лишней нагрузки.
     */
    const fireHoldTimerRef = useRef<number | null>(null);

    const stopHoldFire = useCallback(() => {
        if (fireHoldTimerRef.current !== null) {
            window.clearInterval(fireHoldTimerRef.current);
            fireHoldTimerRef.current = null;
        }
    }, []);

    useEffect(() => stopHoldFire, [stopHoldFire]);

    const bindFireTouch = () => ({
        onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
            e.preventDefault();
            e.stopPropagation();
            try {
                e.currentTarget.setPointerCapture(e.pointerId);
            } catch {
                /* ignore */
            }
            touchBridgeRef.current.fire();
            stopHoldFire();
            fireHoldTimerRef.current = window.setInterval(() => {
                touchBridgeRef.current.fire();
            }, 120);
        },
        onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => {
            e.preventDefault();
            stopHoldFire();
            try {
                e.currentTarget.releasePointerCapture(e.pointerId);
            } catch {
                /* ignore */
            }
        },
        onPointerCancel: () => stopHoldFire(),
        onLostPointerCapture: () => stopHoldFire()
    });

    /**
     * Преобразуем вектор джойстика в дискретные WASD. Порог небольшой (0.25),
     * чтобы на короткие наклоны уже шла реакция. По диагонали можно одновременно
     * ехать и поворачивать — т.е. удерживать W и A сразу.
     */
    const joyStateRef = useRef({ w: false, s: false, a: false, d: false });
    const handleJoystickVector = useCallback(
        (v: { x: number; y: number }) => {
            const TH = 0.25;
            const bridge = touchBridgeRef.current;
            const next = {
                w: v.y < -TH,
                s: v.y > TH,
                a: v.x < -TH,
                d: v.x > TH
            };
            const prev = joyStateRef.current;
            if (next.w !== prev.w) {
                next.w ? bridge.keyDown(VK_W) : bridge.keyUp(VK_W);
            }
            if (next.s !== prev.s) {
                next.s ? bridge.keyDown(VK_S) : bridge.keyUp(VK_S);
            }
            if (next.a !== prev.a) {
                next.a ? bridge.keyDown(VK_A) : bridge.keyUp(VK_A);
            }
            if (next.d !== prev.d) {
                next.d ? bridge.keyDown(VK_D) : bridge.keyUp(VK_D);
            }
            joyStateRef.current = next;
        },
        []
    );

    // Show loading screen while images are loading
    if (!imagesLoaded) {
        const progressPercent = loadingProgress.total > 0 
            ? Math.round((loadingProgress.loaded / loadingProgress.total) * 100) 
            : 0;
        
        return (
            <div className="game-screen">
                <div className="game-loading">
                    <div className="game-loading-title">
                        {loadingStage}
                    </div>
                    {loadingProgress.total > 0 && (
                        <div className="game-loading-progress-wrap">
                            <div className="game-loading-progress-track">
                                <div className="game-loading-progress-fill" style={{ width: `${progressPercent}%` }}>
                                    {progressPercent}%
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="game-loading-sub">
                        {loadingProgress.total > 0 
                            ? `${loadingProgress.loaded} / ${loadingProgress.total} изображений`
                            : 'Инициализация...'}
                    </div>
                </div>
            </div>
        );
    }

    const isTimeCritical = timeRemaining != null && timeRemaining <= (isDeathmatch ? 15 : 60);
    const timerCardClass = isTimeCritical ? 'hud-card hud-card-timer is-critical' : 'hud-card hud-card-timer';
    const timerValueClass = isTimeCritical ? 'hud-value is-critical' : 'hud-value';

    const touchSide = settings.mobile.touchSide;
    const touchScale = settings.mobile.touchScale;
    const leftSideClass =
        touchSide === 'left' ? 'game-touch-left' : 'game-touch-left game-touch-left--right';
    const rightSideClass =
        touchSide === 'left' ? 'game-touch-right' : 'game-touch-right game-touch-right--left';
    const touchScaleStyle: React.CSSProperties = { transform: `scale(${touchScale})`, transformOrigin: 'bottom' };

    const handlePingPicked = (type: PingType) => {
        const snap = snapshotRef.current;
        const me = snap?.tanks.find((t) => t.playerId === myPlayerId);
        if (!me) return;
        // Пингуем точку перед башней, примерно 200 единиц мира
        const x = me.x + Math.cos(me.turretAngle) * 200;
        const y = me.y + Math.sin(me.turretAngle) * 200;
        wsClient.send({ type: 'ping:send', x, y, pingType: type } as any);
    };

    return (
        <div className="game-screen">
            <div className="game-screen-grid-overlay" />
            <canvas
                ref={canvasRef}
                className="game-canvas"
            />
            <FullscreenToggle />
            <Minimap snapshotRef={snapshotRef} myPlayerId={myPlayerId} />
            <KillFeed kills={hud.kills} />
            <DamageNumbers hits={hud.hits} />
            <DamageDirection events={hud.damageTaken} />
            {worldPings.map((p) => {
                const screen = {
                    x: ResolutionManager.worldToCanvasX(p.x),
                    y: ResolutionManager.worldToCanvasY(p.y)
                };
                return (
                    <div key={p.id} className="world-ping" style={{ left: screen.x, top: screen.y }}>
                        {p.fromName}: {pingLabel(p.type)}
                    </div>
                );
            })}
            {pingWheelOpen && (
                <PingWheel onPick={handlePingPicked} onClose={() => setPingWheelOpen(false)} />
            )}
            {useTouchUi && (
                <div className="mobile-orientation-hint" aria-hidden="true">
                    Поверните телефон горизонтально для удобной игры
                </div>
            )}
            {useTouchUi && (
                <>
                    <div className={leftSideClass} role="presentation" style={touchScaleStyle}>
                        <TouchJoystick onVector={handleJoystickVector} />
                        <div className="game-touch-hint">
                            Вверх/вниз — ход · влево/вправо — поворот
                        </div>
                    </div>
                    <div className={rightSideClass} role="toolbar" aria-label="Управление" style={touchScaleStyle}>
                        <div className="game-touch-turret">
                            <button
                                type="button"
                                className="game-touch-btn game-touch-btn-turret"
                                {...bindTouchKey(VK_Q)}
                                aria-label="Башня влево"
                            >
                                ⟲
                            </button>
                            <button
                                type="button"
                                className="game-touch-btn game-touch-btn-turret"
                                {...bindTouchKey(VK_E)}
                                aria-label="Башня вправо"
                            >
                                ⟳
                            </button>
                        </div>
                        <button
                            type="button"
                            className="game-touch-btn game-touch-btn-ping"
                            onClick={() => setPingWheelOpen((v) => !v)}
                            aria-label="Пинг"
                        >
                            !
                        </button>
                        <button
                            type="button"
                            className="game-touch-btn game-touch-btn-fire"
                            {...bindFireTouch()}
                            aria-label="Огонь"
                        >
                            ОГОНЬ
                        </button>
                    </div>
                </>
            )}
            <div ref={menuRef} className="game-ui game-ui-modern">
                <div className="game-stats game-stats-modern">
                    {!isDeathmatch && (
                        <div className="hud-card hud-card-level">
                            <label className="hud-label">Уровень</label>
                            <span className="hud-value hud-value-level">{currentLevel}</span>
                        </div>
                    )}
                    <div className={timerCardClass}>
                        <label className="hud-label">{isDeathmatch ? 'До конца раунда' : 'Осталось времени'}</label>
                        <span className={timerValueClass}>
                            {timeRemaining == null ? '—' : formatTime(timeRemaining)}
                        </span>
                    </div>
                    {isDeathmatch ? (
                        <div className="hud-card hud-card-kills">
                            <label className="hud-label">Ваши фраги</label>
                            <span className="hud-value hud-value-kills">{myKills}</span>
                        </div>
                    ) : (
                        <div className={keysCollected >= REQUIRED_KEYS_PER_LEVEL ? 'hud-card hud-card-keys is-complete' : 'hud-card hud-card-keys'}>
                            <label className="hud-label">Собрано ключей</label>
                            <span className={keysCollected >= REQUIRED_KEYS_PER_LEVEL ? 'hud-value hud-value-keys is-complete' : 'hud-value hud-value-keys'}>
                                {keysCollected} / {REQUIRED_KEYS_PER_LEVEL}
                            </span>
                        </div>
                    )}
                    <div className="hud-card hud-card-exit">
                        <button type="button" className="replays-back-btn" onClick={onLeaveGame}>
                            Выйти из матча
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

function pingLabel(type: PingType): string {
    switch (type) {
        case 'careful':
            return 'Осторожно';
        case 'enemy':
            return 'Вижу врага';
        case 'attack':
            return 'Атакую';
        case 'retreat':
            return 'Отступаю';
    }
}

export default GameScreen;
