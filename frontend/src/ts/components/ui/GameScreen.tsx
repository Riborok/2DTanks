import React, { useEffect, useRef, useState } from 'react';
import { WebSocketClient } from '../../online/WebSocketClient';
import { OnlineGameRenderer } from '../../online/OnlineGameRenderer';
import { GameWorldSnapshot } from '../../online/types';
import { Size } from '../../additionally/type';
import { ResolutionManager } from '../../constants/gameConstants';
import { VK_W, VK_S, VK_A, VK_D, VK_Q, VK_E, VK_SPACE } from '../../constants/keyCodes';
import { ImagePreloader } from '../../utils/ImagePreloader';
import type { DeathmatchScoreRow, PlayerMatchStatsRow } from './GameEndScreen';

const REQUIRED_KEYS_PER_LEVEL = 1;

const GAME_KEY_CODES = [VK_W, VK_S, VK_A, VK_D, VK_Q, VK_E, VK_SPACE];

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

function normalizeControlKeyCode(e: KeyboardEvent): number | null {
    switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
            return VK_W;
        case 'KeyS':
        case 'ArrowDown':
            return VK_S;
        case 'KeyA':
        case 'ArrowLeft':
            return VK_A;
        case 'KeyD':
        case 'ArrowRight':
            return VK_D;
        case 'KeyQ':
            return VK_Q;
        case 'KeyE':
            return VK_E;
        case 'Space':
            return VK_SPACE;
        default:
            break;
    }
    // Fallback for old browsers / non-standard events.
    return GAME_KEY_CODES.includes(e.keyCode) ? e.keyCode : null;
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
            if (!GAME_KEY_CODES.includes(code)) return;
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
            if (!GAME_KEY_CODES.includes(code)) return;
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
            wsClient.send({ type: 'action', action: buildAction(keysPressedRef.current, true) });
        };

        touchBridgeRef.current = {
            keyDown: applyKeyDown,
            keyUp: applyKeyUp,
            fire: applyFirePress
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            const code = normalizeControlKeyCode(e);
            if (code === null) return;
            if (code === VK_SPACE) {
                e.preventDefault();
            }
            applyKeyDown(code);
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            const code = normalizeControlKeyCode(e);
            if (code === null) return;
            if (code === VK_SPACE) {
                e.preventDefault();
            }
            applyKeyUp(code);
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

    const bindFireTouch = () => ({
        onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
            e.preventDefault();
            e.stopPropagation();
            touchBridgeRef.current.fire();
        }
    });

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

    return (
        <div className="game-screen">
            <div className="game-screen-grid-overlay" />
            <canvas
                ref={canvasRef}
                className="game-canvas"
            />
            {useTouchUi && (
                <div className="game-touch-controls" role="toolbar" aria-label="Управление">
                    <div className="game-touch-controls-inner">
                        <div className="game-touch-cluster">
                            <div className="game-touch-row">
                                <button type="button" className="game-touch-btn" {...bindTouchKey(VK_Q)} aria-label="Башня влево">
                                    ⟲
                                </button>
                                <button type="button" className="game-touch-btn" {...bindTouchKey(VK_W)} aria-label="Вперёд">
                                    W
                                </button>
                                <button type="button" className="game-touch-btn" {...bindTouchKey(VK_E)} aria-label="Башня вправо">
                                    ⟳
                                </button>
                            </div>
                            <div className="game-touch-row">
                                <button type="button" className="game-touch-btn" {...bindTouchKey(VK_A)} aria-label="Влево">
                                    A
                                </button>
                                <button type="button" className="game-touch-btn" {...bindTouchKey(VK_S)} aria-label="Назад">
                                    S
                                </button>
                                <button type="button" className="game-touch-btn" {...bindTouchKey(VK_D)} aria-label="Вправо">
                                    D
                                </button>
                            </div>
                        </div>
                        <div className="game-touch-cluster game-touch-cluster-fire">
                            <button type="button" className="game-touch-btn game-touch-btn-fire" {...bindFireTouch()} aria-label="Огонь">
                                ОГОНЬ
                            </button>
                        </div>
                    </div>
                </div>
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

export default GameScreen;
