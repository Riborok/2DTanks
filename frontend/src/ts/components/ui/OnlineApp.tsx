import React, { useState, useEffect } from 'react';
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

    useEffect(() => {
        // Connect to WebSocket server
        wsClient.connect().catch(err => {
            console.error('Failed to connect:', err);
            setError('Не удалось подключиться к серверу. Убедитесь, что сервер запущен.');
        });

        // Listen for messages
        wsClient.on('joined', (message) => {
            console.log('Joined room:', message.roomId, 'as', message.role);
            setRoomId(message.roomId || '');
            setMyPlayerId(message.playerId || '');
            setMyRole(message.role || 'attacker');
            setScreen('tankSelection');
            setError('');
        });

        wsClient.on('error', (message) => {
            setError(message.message || 'Ошибка подключения');
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
            }
        });

        wsClient.on('gameStart', () => {
            console.log('Game starting!');
            setScreen('game');
        });

        wsClient.on('snapshot', () => {
            // Snapshot received - game is running
            // gameStart message should have already switched us to game screen
            // But as fallback, ensure we're on game screen if we receive snapshots
            setScreen(prevScreen => {
                if (prevScreen !== 'game' && prevScreen !== 'gameEnd') {
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
        // Send tank config to server and move to lobby
        console.log('Sending tank config and moving to lobby');
        wsClient.send({
            type: 'tankConfig',
            data: config
        });
        setMyTankConfig(config);
        setScreen('lobby');
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
        setRoomId('');
        setMyPlayerId('');
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
                <OnlineTankCustomizer onAccept={handleTankConfigAccept} />
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
