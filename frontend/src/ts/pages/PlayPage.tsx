import React, { useCallback, useEffect, useRef, useState } from 'react';
import PlayHubScreen from '../components/ui/PlayHubScreen';
import OnlineTankCustomizer from '../components/ui/OnlineTankCustomizer';
import LobbyScreen from '../components/ui/LobbyScreen';
import GameScreen from '../components/ui/GameScreen';
import GameEndScreen, { type DeathmatchScoreRow, type PlayerMatchStatsRow } from '../components/ui/GameEndScreen';
import { useAuth } from '../context/AuthContext';
import { TANKS_PENDING_JOIN_ROOM_EVENT, useGameWebSocket } from '../context/GameSocketContext';

type PlayScreen = 'hub' | 'tankSelection' | 'lobby' | 'game' | 'gameEnd';

interface Player {
    playerId: string;
    role: 'attacker' | 'defender' | 'fighter';
    tankConfig?: any;
    ready?: boolean;
    displayName?: string;
    userId?: string;
}

function enrichDeathmatchScores(
    scores: DeathmatchScoreRow[],
    players: Player[]
): DeathmatchScoreRow[] {
    return scores.map((s) => ({
        ...s,
        displayName: players.find((p) => p.playerId === s.playerId)?.displayName
    }));
}

function enrichMatchStats(
    stats: PlayerMatchStatsRow[],
    players: Player[]
): PlayerMatchStatsRow[] {
    return stats.map((s) => ({
        ...s,
        displayName: players.find((p) => p.playerId === s.playerId)?.displayName
    }));
}

const PlayPage: React.FC = () => {
    const { authRestored, accessToken, authUser } = useAuth();
    const { wsClient } = useGameWebSocket();
    const [screen, setScreen] = useState<PlayScreen>('hub');

    const [roomId, setRoomId] = useState<string>('');
    const [myPlayerId, setMyPlayerId] = useState<string>('');
    const [myRole, setMyRole] = useState<'attacker' | 'defender' | 'fighter'>('attacker');
    const [players, setPlayers] = useState<Player[]>([]);
    const [error, setError] = useState<string>('');
    const [gameEndReason, setGameEndReason] = useState<
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
        | null
    >(null);
    const [myTankConfig, setMyTankConfig] = useState<any>(null);
    const [singlePlayerRoom, setSinglePlayerRoom] = useState(false);
    const [practiceRoom, setPracticeRoom] = useState(false);
    const [deathmatchRoom, setDeathmatchRoom] = useState(false);

    const myPlayerIdRef = useRef<string>('');
    const screenRef = useRef<PlayScreen>('hub');

    useEffect(() => {
        if (!authRestored || !accessToken || !authUser) {
            return;
        }

        let cancelled = false;
        void wsClient.connect().catch((err) => {
            console.error('Failed to connect:', err);
            if (!cancelled) {
                setError(
                    'Не удалось подключиться к серверу. Убедитесь, что сервер запущен и вы вошли в аккаунт.'
                );
            }
        });

        const onJoined = (message: any) => {
            console.log('Joined room:', message.roomId, 'as', message.role);
            const playerId = message.playerId || '';
            setRoomId(message.roomId || '');
            setMyPlayerId(playerId);
            myPlayerIdRef.current = playerId;
            const r = message.role;
            setMyRole(r === 'defender' || r === 'fighter' || r === 'attacker' ? r : 'attacker');
            setScreen('tankSelection');
            screenRef.current = 'tankSelection';
            setError('');
        };

        const onError = (message: any) => {
            const errorMessage = message.message || 'Ошибка подключения';
            setError(errorMessage);
            console.error('WebSocket error:', errorMessage);
        };

        const onRoomUpdate = (message: any) => {
            console.log('Received roomUpdate:', message);
            if (message.singlePlayerTest === true) {
                setSinglePlayerRoom(true);
                setPracticeRoom(false);
                setDeathmatchRoom(false);
            } else {
                setSinglePlayerRoom(false);
                setPracticeRoom(message.practiceMode === true);
                setDeathmatchRoom(message.deathmatchMode === true);
            }
            if (message.players) {
                const playersWithReady = message.players.map((p: any) => ({
                    ...p,
                    ready: p.ready === true ? true : false
                }));
                setPlayers(playersWithReady);

                const currentMyPlayerId = myPlayerIdRef.current;
                const currentScreen = screenRef.current;
                const myPlayer = playersWithReady.find((p: Player) => p.playerId === currentMyPlayerId);

                if (myPlayer?.tankConfig && currentScreen === 'tankSelection') {
                    setMyTankConfig(myPlayer.tankConfig);
                    setScreen('lobby');
                    screenRef.current = 'lobby';
                    setError('');
                }
            }
        };

        const onGameStart = () => {
            console.log('Game starting!');
            setScreen('game');
            screenRef.current = 'game';
        };

        const onSnapshot = () => {
            setScreen((prevScreen) => {
                if (prevScreen !== 'game' && prevScreen !== 'gameEnd') {
                    screenRef.current = 'game';
                    return 'game';
                }
                return prevScreen;
            });
        };

        wsClient.on('joined', onJoined);
        wsClient.on('error', onError);
        wsClient.on('roomUpdate', onRoomUpdate);
        wsClient.on('gameStart', onGameStart);
        wsClient.on('snapshot', onSnapshot);

        return () => {
            cancelled = true;
            wsClient.off('joined', onJoined);
            wsClient.off('error', onError);
            wsClient.off('roomUpdate', onRoomUpdate);
            wsClient.off('gameStart', onGameStart);
            wsClient.off('snapshot', onSnapshot);
        };
    }, [authRestored, accessToken, authUser, wsClient]);

    const handleCreateRoom = () => {
        setError('');
        setSinglePlayerRoom(false);
        setPracticeRoom(false);
        setDeathmatchRoom(false);
        wsClient.send({ type: 'createRoom' });
    };

    const handleCreateDeathmatchRoom = () => {
        setError('');
        setSinglePlayerRoom(false);
        setPracticeRoom(false);
        setDeathmatchRoom(true);
        wsClient.send({ type: 'createRoom', deathmatch: true });
    };

    const handleCreatePracticeRoom = () => {
        setError('');
        setSinglePlayerRoom(false);
        setPracticeRoom(true);
        setDeathmatchRoom(false);
        wsClient.send({ type: 'createRoom', practice: true });
    };

    const handleCreateSoloTest = () => {
        setError('');
        setSinglePlayerRoom(true);
        setPracticeRoom(false);
        setDeathmatchRoom(false);
        wsClient.send({ type: 'createRoom', singlePlayer: true });
    };

    const handleJoinRoom = (code: string) => {
        setError('');
        setSinglePlayerRoom(false);
        setPracticeRoom(false);
        setDeathmatchRoom(false);
        wsClient.send({ type: 'joinRoom', code });
    };

    /** Покинуть текущую сессию (если есть) и подключиться к комнате по коду — для accept инвайта. */
    const leaveAndJoinRoom = useCallback(
        (code: string) => {
            setError('');
            const c = code.trim().toUpperCase();
            const joinAfterConnect = () => {
                void wsClient
                    .connect()
                    .then(() => {
                        wsClient.send({ type: 'joinRoom', code: c });
                    })
                    .catch((err) => {
                        console.error(err);
                        setError('Не удалось подключиться к комнате');
                    });
            };

            if (screenRef.current === 'hub' && !myPlayerIdRef.current) {
                joinAfterConnect();
                return;
            }

            wsClient.send({ type: 'leaveGame' });
            setRoomId('');
            setMyPlayerId('');
            myPlayerIdRef.current = '';
            setMyRole('attacker');
            setPlayers([]);
            setScreen('hub');
            screenRef.current = 'hub';
            setSinglePlayerRoom(false);
            setPracticeRoom(false);
            setDeathmatchRoom(false);
            setGameEndReason(null);
            joinAfterConnect();
        },
        [wsClient]
    );

    const leaveAndJoinRef = useRef(leaveAndJoinRoom);
    leaveAndJoinRef.current = leaveAndJoinRoom;

    useEffect(() => {
        const onPendingJoin = (e: Event) => {
            const code = (e as CustomEvent<{ code?: string }>).detail?.code;
            if (code && typeof code === 'string') {
                leaveAndJoinRef.current(code);
            }
        };
        window.addEventListener(TANKS_PENDING_JOIN_ROOM_EVENT, onPendingJoin as EventListener);
        return () => window.removeEventListener(TANKS_PENDING_JOIN_ROOM_EVENT, onPendingJoin as EventListener);
    }, []);

    const handleTankConfigAccept = (config: {
        color: number;
        hullNum: number;
        trackNum: number;
        turretNum: number;
        weaponNum: number;
    }) => {
        console.log('Sending tank config to server');
        wsClient.send({
            type: 'tankConfig',
            data: config
        });
    };

    const handleReady = () => {
        console.log('Sending ready message');
        wsClient.send({ type: 'ready', ready: true });
    };

    const handleGameEnd = (
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
    ) => {
        setGameEndReason(result);
        setScreen('gameEnd');
        screenRef.current = 'gameEnd';
    };

    const handleDisconnect = () => {
        setError('Соединение с сервером потеряно');
        setScreen('hub');
        screenRef.current = 'hub';
        setSinglePlayerRoom(false);
        setPracticeRoom(false);
        setDeathmatchRoom(false);
    };

    const handleBackToMenu = () => {
        if (myPlayerIdRef.current) {
            wsClient.send({ type: 'leaveGame' });
        }
        setScreen('hub');
        screenRef.current = 'hub';
        setRoomId('');
        setMyPlayerId('');
        myPlayerIdRef.current = '';
        setMyRole('attacker');
        setPlayers([]);
        setError('');
        setGameEndReason(null);
        setSinglePlayerRoom(false);
        setPracticeRoom(false);
    };

    const handleLeaveGame = () => {
        if (myPlayerIdRef.current) {
            wsClient.send({ type: 'leaveGame' });
        }
        setScreen('hub');
        screenRef.current = 'hub';
        setRoomId('');
        setMyPlayerId('');
        myPlayerIdRef.current = '';
        setMyRole('attacker');
        setPlayers([]);
        setError('');
        setGameEndReason(null);
        setSinglePlayerRoom(false);
        setPracticeRoom(false);
        setDeathmatchRoom(false);
    };

    return (
        <div className={`play-page-root ${screen === 'hub' ? '' : 'app-container'}`}>
            {screen === 'hub' && (
                <PlayHubScreen
                    onCreateRoom={handleCreateRoom}
                    onCreateDeathmatchRoom={handleCreateDeathmatchRoom}
                    onCreatePracticeRoom={handleCreatePracticeRoom}
                    onCreateSoloTest={handleCreateSoloTest}
                    onJoinRoom={handleJoinRoom}
                    error={error}
                />
            )}

            {screen === 'tankSelection' && (
                <OnlineTankCustomizer onAccept={handleTankConfigAccept} players={players} myPlayerId={myPlayerId} />
            )}

            {screen === 'lobby' && (
                <LobbyScreen
                    roomId={roomId}
                    myPlayerId={myPlayerId}
                    myRole={myRole}
                    players={players}
                    singlePlayerRoom={singlePlayerRoom}
                    practiceRoom={practiceRoom}
                    deathmatchRoom={deathmatchRoom}
                    onReady={handleReady}
                    onCopyCode={() => {}}
                    wsClient={wsClient}
                    accessToken={accessToken}
                    myAuthUserId={authUser?.userId}
                    serverError={error}
                    onClearServerError={() => setError('')}
                />
            )}

            {screen === 'game' && (
                <GameScreen
                    wsClient={wsClient}
                    myPlayerId={myPlayerId}
                    myRole={myRole}
                    myTankConfig={myTankConfig}
                    players={players}
                    isDeathmatch={deathmatchRoom}
                    onGameEnd={handleGameEnd}
                    onDisconnect={handleDisconnect}
                    onLeaveGame={handleLeaveGame}
                />
            )}

            {screen === 'gameEnd' && gameEndReason && (
                <GameEndScreen
                    onBackToMenu={handleBackToMenu}
                    mode={gameEndReason.mode}
                    reason={gameEndReason.reason}
                    myPlayerId={myPlayerId}
                    {...(gameEndReason.mode === 'standard'
                        ? {
                              winner: gameEndReason.winner,
                              myRole,
                              stats: enrichMatchStats(gameEndReason.stats, players)
                          }
                        : {
                              scores: enrichDeathmatchScores(gameEndReason.scores, players),
                              stats: enrichMatchStats(gameEndReason.stats, players),
                              winnerPlayerIds: gameEndReason.winnerPlayerIds
                          })}
                />
            )}
        </div>
    );
};

export default PlayPage;
