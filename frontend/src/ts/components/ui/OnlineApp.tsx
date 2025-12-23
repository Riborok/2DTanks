import React, { useState, useEffect, useRef } from 'react';
import { WebSocketClient } from '../../online/WebSocketClient';
import ConnectionScreen from './ConnectionScreen';
import OnlineTankCustomizer from './OnlineTankCustomizer';
import LobbyScreen from './LobbyScreen';
import GameScreen from './GameScreen';
import './App.css';
import './OnlineApp.css';

type Screen = 'connection' | 'tankSelection' | 'lobby' | 'game' | 'gameEnd';

interface Player {
    playerId: string;
    role: 'attacker' | 'defender';
    tankConfig?: any;
    ready?: boolean;
}

const OnlineApp: React.FC = () => {
    const [screen, setScreen] = useState<Screen>('connection');
    const [wsClient] = useState<WebSocketClient>(new WebSocketClient());
    const [roomId, setRoomId] = useState<string>('');
    const [myPlayerId, setMyPlayerId] = useState<string>('');
    const [myRole, setMyRole] = useState<'attacker' | 'defender'>('attacker');
    const [players, setPlayers] = useState<Player[]>([]);
    const [error, setError] = useState<string>('');
    const [gameEndReason, setGameEndReason] = useState<{ winner: 'attacker' | 'defender'; reason: string } | null>(null);
    const [myTankConfig, setMyTankConfig] = useState<any>(null);
    
    // Use refs to access latest values in callbacks
    const myPlayerIdRef = useRef<string>('');
    const screenRef = useRef<Screen>('connection');

    useEffect(() => {
        // Connect to WebSocket server
        wsClient.connect().catch(err => {
            console.error('Failed to connect:', err);
            setError('Не удалось подключиться к серверу. Убедитесь, что сервер запущен.');
        });

        // Listen for messages
        wsClient.on('joined', (message) => {
            console.log('Joined room:', message.roomId, 'as', message.role);
            const playerId = message.playerId || '';
            setRoomId(message.roomId || '');
            setMyPlayerId(playerId);
            myPlayerIdRef.current = playerId;
            setMyRole(message.role || 'attacker');
            setScreen('tankSelection');
            screenRef.current = 'tankSelection';
            setError('');
        });

        wsClient.on('error', (message) => {
            const errorMessage = message.message || 'Ошибка подключения';
            setError(errorMessage);
            console.error('WebSocket error:', errorMessage);
            // If error occurs during tank config, stay on tank selection screen
            if (screen === 'tankSelection') {
                // Error already shown, don't navigate away
            }
        });

        wsClient.on('roomUpdate', (message) => {
            console.log('Received roomUpdate:', message);
            if (message.players) {
                console.log('Updating players:', message.players);
                // Ensure ready is explicitly set to false if undefined
                const playersWithReady = message.players.map((p: any) => ({
                    ...p,
                    ready: p.ready === true ? true : false
                }));
                console.log('Players with explicit ready status:', playersWithReady);
                setPlayers(playersWithReady);
                
                // Check if my player has tank config - if so, we can move to lobby
                // Use refs to access latest values
                const currentMyPlayerId = myPlayerIdRef.current;
                const currentScreen = screenRef.current;
                const myPlayer = playersWithReady.find((p: Player) => p.playerId === currentMyPlayerId);
                
                if (myPlayer?.tankConfig && currentScreen === 'tankSelection') {
                    console.log('Moving to lobby - tank config confirmed');
                    setMyTankConfig(myPlayer.tankConfig);
                    setScreen('lobby');
                    screenRef.current = 'lobby';
                    setError(''); // Clear any previous errors
                }
            }
        });

        wsClient.on('gameStart', () => {
            console.log('Game starting!');
            setScreen('game');
            screenRef.current = 'game';
        });

        wsClient.on('snapshot', () => {
            // Snapshot received - game is running
            // gameStart message should have already switched us to game screen
            // But as fallback, ensure we're on game screen if we receive snapshots
            setScreen(prevScreen => {
                if (prevScreen !== 'game' && prevScreen !== 'gameEnd') {
                    screenRef.current = 'game';
                    return 'game';
                }
                return prevScreen;
            });
        });

        // Cleanup on unmount
        return () => {
            wsClient.disconnect();
        };
    }, [wsClient]);

    const handleCreateRoom = () => {
        setError('');
        wsClient.send({ type: 'createRoom' });
    };

    const handleJoinRoom = (code: string) => {
        setError('');
        wsClient.send({ type: 'joinRoom', code });
    };

    const handleTankConfigAccept = (config: {
        color: number;
        hullNum: number;
        trackNum: number;
        turretNum: number;
        weaponNum: number;
    }) => {
        // Send tank config to server (don't move to lobby yet - wait for confirmation)
        console.log('Sending tank config to server');
        wsClient.send({
            type: 'tankConfig',
            data: config
        });
        // Don't update state yet - wait for roomUpdate to confirm the config was accepted
    };

    const handleReady = () => {
        console.log('Sending ready message');
        wsClient.send({ type: 'ready', ready: true });
        // Don't update local state optimistically - wait for server response
        // The server will send roomUpdate with correct state for all players
    };

    const handleGameStart = () => {
        setScreen('game');
    };

    const handleGameEnd = (winner: 'attacker' | 'defender', reason: string) => {
        setGameEndReason({ winner, reason });
        setScreen('gameEnd');
    };

    const handleDisconnect = () => {
        setError('Соединение с сервером потеряно');
        setScreen('connection');
    };

    const handleBackToMenu = () => {
        wsClient.disconnect();
        setScreen('connection');
        screenRef.current = 'connection';
        setRoomId('');
        setMyPlayerId('');
        myPlayerIdRef.current = '';
        setMyRole('attacker');
        setPlayers([]);
        setError('');
        setGameEndReason(null);
        // Reconnect
        wsClient.connect().catch(err => {
            console.error('Failed to reconnect:', err);
        });
    };

    // Game start is now handled via 'gameStart' message from server (in useEffect above)

    return (
        <div className="app-container">
            {screen === 'connection' && (
                <ConnectionScreen
                    onCreateRoom={handleCreateRoom}
                    onJoinRoom={handleJoinRoom}
                    error={error}
                />
            )}

            {screen === 'tankSelection' && (
                <OnlineTankCustomizer 
                    onAccept={handleTankConfigAccept}
                    players={players}
                    myPlayerId={myPlayerId}
                />
            )}

            {screen === 'lobby' && (
                <LobbyScreen
                    roomId={roomId}
                    myPlayerId={myPlayerId}
                    myRole={myRole}
                    players={players}
                    onReady={handleReady}
                    onCopyCode={() => {}}
                />
            )}

            {screen === 'game' && (
                <GameScreen
                    wsClient={wsClient}
                    myPlayerId={myPlayerId}
                    myRole={myRole}
                    myTankConfig={myTankConfig}
                    players={players}
                    onGameEnd={handleGameEnd}
                    onDisconnect={handleDisconnect}
                />
            )}

            {screen === 'gameEnd' && gameEndReason && (
                <div className="game-end-screen">
                    <h1>
                        {gameEndReason.winner === myRole ? 'Победа!' : 'Поражение'}
                    </h1>
                    <p>Причина: {gameEndReason.reason}</p>
                    <button onClick={handleBackToMenu}>Вернуться в меню</button>
                </div>
            )}
        </div>
    );
};

export default OnlineApp;
