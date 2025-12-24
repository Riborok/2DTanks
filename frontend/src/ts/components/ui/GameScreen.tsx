import React, { useEffect, useRef, useState } from 'react';
import { WebSocketClient } from '../../online/WebSocketClient';
import { OnlineGameRenderer } from '../../online/OnlineGameRenderer';
import { GameWorldSnapshot } from '../../online/types';
import { Size } from '../../additionally/type';
import { ResolutionManager } from '../../constants/gameConstants';
import { VK_W, VK_S, VK_A, VK_D, VK_Q, VK_E, VK_SPACE } from '../../constants/keyCodes';
import { ImagePreloader } from '../../utils/ImagePreloader';

const REQUIRED_KEYS_PER_LEVEL = 1;

interface GameScreenProps {
    wsClient: WebSocketClient;
    myPlayerId: string;
    myRole: 'attacker' | 'defender';
    myTankConfig: any;
    players: Array<{
        playerId: string;
        role: 'attacker' | 'defender';
        tankConfig?: any;
        ready?: boolean;
    }>;
    onGameEnd: (winner: 'attacker' | 'defender', reason: string) => void;
    onDisconnect: () => void;
}

const GameScreen: React.FC<GameScreenProps> = ({ wsClient, myPlayerId, myRole, myTankConfig, players, onGameEnd, onDisconnect }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rendererRef = useRef<OnlineGameRenderer | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const snapshotRef = useRef<GameWorldSnapshot | null>(null);
    const tankConfigsRef = useRef<Map<string, { hullNum: number; trackNum: number; turretNum: number; weaponNum: number; color: number }>>(new Map());
    const menuRef = useRef<HTMLDivElement>(null); // Ref for the game UI menu
    
    const [keysPressed, setKeysPressed] = useState<Set<number>>(new Set());
    const keysPressedRef = useRef<Set<number>>(new Set());
    const shootSentRef = useRef<boolean>(false); // Track if shoot was already sent
    const [timeRemaining, setTimeRemaining] = useState<number>(300);
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

            // Initialize resolution AFTER setting canvas size
            ResolutionManager.setResolutionResizeCoeff(canvas.width);
            
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
                setTimeRemaining(Math.max(0, 300 - (world.timeElapsed || 0)));
                // Explicitly handle keysCollected - ensure it's a number
                const keys = typeof world.keysCollected === 'number' ? world.keysCollected : 0;
                setKeysCollected(keys);
                setCurrentLevel(world.currentLevel || 1);
                
                // Update tank configs when snapshot arrives
                if (rendererRef.current) {
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
            const winner = message.winner === myRole ? 'attacker' : 'defender';
            onGameEnd(winner, message.reason || 'gameEnd');
        };

        const handleError = (message: any) => {
            if (message.message?.includes('disconnect')) {
                onDisconnect();
            }
        };

        wsClient.on('snapshot', handleSnapshot);
        wsClient.on('gameEnd', handleGameEnd);
        wsClient.on('error', handleError);

        // Helper function to build action object from pressed keys
        const buildAction = (pressedKeys: Set<number>, includeShoot: boolean = false) => {
            return {
                forward: pressedKeys.has(VK_W),
                backward: pressedKeys.has(VK_S),
                turnLeft: pressedKeys.has(VK_A),
                turnRight: pressedKeys.has(VK_D),
                turretLeft: pressedKeys.has(VK_Q),
                turretRight: pressedKeys.has(VK_E),
                shoot: includeShoot && pressedKeys.has(VK_SPACE)
            };
        };

        // Helper function to send action (used when all keys released)
        const sendAction = () => {
            if (snapshotRef.current) {
                const action = buildAction(keysPressedRef.current);
                wsClient.send({ type: 'action', action });
            }
        };

        // Keyboard handlers
        const handleKeyDown = (e: KeyboardEvent) => {
            // Only handle game-related keys
            const gameKeys = [VK_W, VK_S, VK_A, VK_D, VK_Q, VK_E, VK_SPACE];
            if (!gameKeys.includes(e.keyCode)) return;
            
            // Prevent default behavior for spacebar (page scroll)
            if (e.keyCode === VK_SPACE) {
                e.preventDefault();
            }
            
            setKeysPressed(prev => {
                const newSet = new Set(prev);
                const wasPressed = newSet.has(e.keyCode);
                newSet.add(e.keyCode);
                keysPressedRef.current = newSet; // Keep ref in sync
                
                // For shoot key, send action immediately on keydown (only once)
                if (e.keyCode === VK_SPACE && !wasPressed && snapshotRef.current) {
                    shootSentRef.current = true;
                    const action = buildAction(newSet, true); // Include shoot in action
                    wsClient.send({ type: 'action', action });
                }
                
                return newSet;
            });
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            // Only handle game-related keys
            const gameKeys = [VK_W, VK_S, VK_A, VK_D, VK_Q, VK_E, VK_SPACE];
            if (!gameKeys.includes(e.keyCode)) return;
            
            // Prevent default behavior for spacebar (page scroll)
            if (e.keyCode === VK_SPACE) {
                e.preventDefault();
                shootSentRef.current = false; // Reset shoot flag when space is released
            }
            
            setKeysPressed(prev => {
                const newSet = new Set(prev);
                newSet.delete(e.keyCode);
                keysPressedRef.current = newSet; // Keep ref in sync
                
                // If all keys released, send action with false values to apply residual movement
                if (newSet.size === 0) {
                    sendAction();
                }
                
                return newSet;
            });
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
    }, [wsClient, myPlayerId, myRole, myTankConfig, players, onGameEnd, onDisconnect, imagesLoaded]);

    // Format time as MM:SS
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(Math.max(0, seconds) / 60);
        const secs = Math.floor(Math.max(0, seconds) % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Show loading screen while images are loading
    if (!imagesLoaded) {
        const progressPercent = loadingProgress.total > 0 
            ? Math.round((loadingProgress.loaded / loadingProgress.total) * 100) 
            : 0;
        
        return (
            <div className="game-screen">
                <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    height: '100vh',
                    backgroundColor: '#1a1a1a',
                    color: '#ffffff',
                    fontFamily: 'Arial, sans-serif'
                }}>
                    <div style={{ fontSize: '24px', marginBottom: '20px' }}>
                        {loadingStage}
                    </div>
                    {loadingProgress.total > 0 && (
                        <div style={{ width: '400px', marginBottom: '10px' }}>
                            <div style={{
                                width: '100%',
                                height: '30px',
                                backgroundColor: '#333',
                                borderRadius: '15px',
                                overflow: 'hidden',
                                border: '2px solid #555'
                            }}>
                                <div style={{
                                    width: `${progressPercent}%`,
                                    height: '100%',
                                    backgroundColor: '#4CAF50',
                                    transition: 'width 0.3s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fff',
                                    fontWeight: 'bold',
                                    fontSize: '14px'
                                }}>
                                    {progressPercent}%
                                </div>
                            </div>
                        </div>
                    )}
                    <div style={{ fontSize: '16px', color: '#aaa' }}>
                        {loadingProgress.total > 0 
                            ? `${loadingProgress.loaded} / ${loadingProgress.total} изображений`
                            : 'Инициализация...'}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="game-screen" style={{ 
            width: '100vw', 
            height: '100vh', 
            position: 'relative', 
            overflow: 'hidden', 
            background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #0f0f1e 50%, #000000 100%)',
            backgroundAttachment: 'fixed'
        }}>
            {/* Decorative background pattern */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `
                    repeating-linear-gradient(
                        0deg,
                        transparent,
                        transparent 2px,
                        rgba(255, 255, 255, 0.02) 2px,
                        rgba(255, 255, 255, 0.02) 4px
                    ),
                    repeating-linear-gradient(
                        90deg,
                        transparent,
                        transparent 2px,
                        rgba(255, 255, 255, 0.02) 2px,
                        rgba(255, 255, 255, 0.02) 4px
                    )
                `,
                pointerEvents: 'none',
                zIndex: 1
            }} />
            <canvas 
                ref={canvasRef} 
                className="game-canvas" 
                style={{ 
                    position: 'absolute', 
                    left: 0, 
                    zIndex: 2 
                }} 
            />
            <div ref={menuRef} className="game-ui" style={{ 
                zIndex: 10000, 
                position: 'fixed', 
                top: '10px', 
                left: '50%',
                transform: 'translateX(-50%)',
                width: 'auto', 
                minWidth: '400px',
                maxWidth: '90vw',
                height: 'auto',
                minHeight: '50px',
                background: 'linear-gradient(180deg, rgba(20, 20, 30, 0.98) 0%, rgba(10, 10, 15, 0.95) 100%)',
                backdropFilter: 'blur(10px)',
                borderRadius: '12px',
                border: '2px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px 20px',
                boxSizing: 'border-box',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
            }}>
                <div className="game-stats" style={{ 
                    display: 'flex', 
                    gap: '15px', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    width: '100%', 
                    maxWidth: '100%',
                    flexWrap: 'wrap',
                    overflow: 'hidden'
                }}>
                    <div className="stat-item" style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        gap: '3px',
                        padding: '6px 12px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        width: 'auto',
                        minWidth: '70px',
                        flexShrink: 1 
                    }}>
                        <label style={{ 
                            fontSize: '10px', 
                            fontWeight: '600', 
                            color: 'rgba(255, 255, 255, 0.7)', 
                            margin: 0,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            whiteSpace: 'nowrap'
                        }}>Уровень</label>
                        <span style={{ 
                            fontSize: '20px', 
                            fontWeight: 'bold', 
                            color: '#4CAF50',
                            fontFamily: 'monospace',
                            textShadow: '0 0 10px rgba(76, 175, 80, 0.5)',
                            whiteSpace: 'nowrap'
                        }}>{currentLevel}</span>
                    </div>
                    <div className="stat-item" style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        gap: '3px',
                        padding: '6px 14px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '6px',
                        border: `1px solid ${timeRemaining <= 60 ? 'rgba(255, 68, 68, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
                        width: 'auto',
                        minWidth: '110px',
                        flexShrink: 1 
                    }}>
                        <label style={{ 
                            fontSize: '10px', 
                            fontWeight: '600', 
                            color: 'rgba(255, 255, 255, 0.7)', 
                            margin: 0,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            whiteSpace: 'nowrap'
                        }}>Осталось времени</label>
                        <span style={{ 
                            color: timeRemaining <= 60 ? '#ff4444' : '#64B5F6', 
                            fontWeight: 'bold',
                            fontSize: '20px',
                            fontFamily: 'monospace',
                            textShadow: `0 0 10px ${timeRemaining <= 60 ? 'rgba(255, 68, 68, 0.5)' : 'rgba(100, 181, 246, 0.5)'}`,
                            whiteSpace: 'nowrap'
                        }}>
                            {formatTime(timeRemaining)}
                        </span>
                    </div>
                    <div className="stat-item" style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        gap: '3px',
                        padding: '6px 14px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '6px',
                        border: `1px solid ${keysCollected >= REQUIRED_KEYS_PER_LEVEL ? 'rgba(76, 175, 80, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
                        width: 'auto',
                        minWidth: '120px',
                        flexShrink: 1 
                    }}>
                        <label style={{ 
                            fontSize: '10px', 
                            fontWeight: '600', 
                            color: 'rgba(255, 255, 255, 0.7)', 
                            margin: 0,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            whiteSpace: 'nowrap'
                        }}>Собрано ключей</label>
                        <span style={{ 
                            color: keysCollected >= REQUIRED_KEYS_PER_LEVEL ? '#4CAF50' : '#FFD54F', 
                            fontWeight: 'bold',
                            fontSize: '20px',
                            fontFamily: 'monospace',
                            textShadow: `0 0 10px ${keysCollected >= REQUIRED_KEYS_PER_LEVEL ? 'rgba(76, 175, 80, 0.5)' : 'rgba(255, 213, 79, 0.5)'}`,
                            whiteSpace: 'nowrap'
                        }}>
                            {keysCollected} / {REQUIRED_KEYS_PER_LEVEL}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GameScreen;
