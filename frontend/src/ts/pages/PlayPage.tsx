import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PlayHubScreen, { type PlayHubGameMode, type PlayHubTab } from '../components/ui/PlayHubScreen';
import OnlineTankCustomizer from '../components/ui/OnlineTankCustomizer';
import LobbyScreen from '../components/ui/LobbyScreen';
import GameScreen from '../components/ui/GameScreen';
import GameEndScreen, { type DeathmatchScoreRow, type PlayerMatchStatsRow } from '../components/ui/GameEndScreen';
import { useAuth } from '../context/AuthContext';
import {
    TANKS_PENDING_JOIN_ROOM_EVENT,
    TANKS_PENDING_JOIN_ROOM_STORAGE_KEY,
    useGameWebSocket
} from '../context/GameSocketContext';

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

const VALID_HUB_MODES = new Set<PlayHubGameMode>(['standard', 'practice', 'deathmatch', 'solo']);

function hubModeFromSearchParams(search: URLSearchParams): PlayHubGameMode | undefined {
    const raw = search.get('mode');
    if (!raw) return undefined;
    const m = raw.toLowerCase();
    return VALID_HUB_MODES.has(m as PlayHubGameMode) ? (m as PlayHubGameMode) : undefined;
}

const PlayPage: React.FC = () => {
    const { authRestored, accessToken, authUser } = useAuth();
    const { wsClient } = useGameWebSocket();
    const [searchParams, setSearchParams] = useSearchParams();
    const hubInitialMode = useMemo(() => hubModeFromSearchParams(searchParams), [searchParams]);
    const hubTab: PlayHubTab = searchParams.get('tab') === 'join' ? 'join' : 'create';

    const setHubTab = useCallback(
        (tab: PlayHubTab) => {
            setSearchParams(
                (prev) => {
                    const next = new URLSearchParams(prev);
                    if (tab === 'join') {
                        next.set('tab', 'join');
                    } else {
                        next.delete('tab');
                    }
                    return next;
                },
                { replace: true }
            );
        },
        [setSearchParams]
    );
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

    const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);

    const myPlayerIdRef = useRef<string>('');
    const screenRef = useRef<PlayScreen>('hub');
    const pendingInviteJoinCodeRef = useRef<string | null>(null);

    useEffect(() => {
        if (!authRestored || !accessToken || !authUser) {
            return;
        }

        let cancelled = false;
        void wsClient.connect().then(() => {
            if (!cancelled) {
                wsClient.send({ type: 'requestGameState' } as any);
            }
        }).catch((err) => {
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
            // Этот «авто-переход в game по снапшоту» — спасательный круг
            // на случай, если клиент пропустил `gameStart` (реконнект и
            // т.п.). Но без проверки myPlayerIdRef он же ломал «Выйти из
            // матча»: handleLeaveGame ставит screen='hub', а ещё пара
            // снапшотов из не закрытой сервером комнаты успевала
            // вернуть нас обратно в game. Поэтому игнорим снапшоты,
            // когда мы уже не считаем себя игроком.
            if (!myPlayerIdRef.current) {
                return;
            }
            setScreen((prevScreen) => {
                if (prevScreen !== 'game' && prevScreen !== 'gameEnd') {
                    screenRef.current = 'game';
                    return 'game';
                }
                return prevScreen;
            });
        };

        const onLeftGame = () => {
            // Сервер подтвердил выход — на всякий случай гасим возможный
            // «прилипший» экран, если локальный handleLeaveGame по
            // какой-то причине не был вызван (например, выход инициирован
            // не кнопкой, а дисконнектом из комнаты).
            myPlayerIdRef.current = '';
            setMyPlayerId('');
            setScreen((prev) => (prev === 'game' ? 'hub' : prev));
            screenRef.current = 'hub';
            const pendingCode = pendingInviteJoinCodeRef.current;
            if (pendingCode) {
                pendingInviteJoinCodeRef.current = null;
                wsClient.send({ type: 'joinRoom', code: pendingCode });
            }
        };

        wsClient.on('joined', onJoined);
        wsClient.on('error', onError);
        wsClient.on('roomUpdate', onRoomUpdate);
        wsClient.on('gameStart', onGameStart);
        wsClient.on('snapshot', onSnapshot);
        wsClient.on('leftGame', onLeftGame);

        return () => {
            cancelled = true;
            wsClient.off('joined', onJoined);
            wsClient.off('error', onError);
            wsClient.off('roomUpdate', onRoomUpdate);
            wsClient.off('gameStart', onGameStart);
            wsClient.off('snapshot', onSnapshot);
            wsClient.off('leftGame', onLeftGame);
        };
    }, [authRestored, accessToken, authUser, wsClient]);

    const handleCreateRoom = (mode: 'standard' | 'practice' | 'deathmatch' | 'solo') => {
        setError('');
        setSinglePlayerRoom(mode === 'solo');
        setPracticeRoom(mode === 'practice');
        setDeathmatchRoom(mode === 'deathmatch');
        wsClient.send({ type: 'createRoom', mode } as any);
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
            const joinAfterConnect = (joinCode: string) => {
                void wsClient
                    .connect()
                    .then(() => {
                        wsClient.send({ type: 'joinRoom', code: joinCode });
                    })
                    .catch((err) => {
                        console.error(err);
                        setError('Не удалось подключиться к комнате');
                    });
            };

            if (screenRef.current === 'hub' && !myPlayerIdRef.current) {
                joinAfterConnect(c);
                return;
            }

            pendingInviteJoinCodeRef.current = c;
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
            // joinRoom отправим только после серверного leftGame (см. onLeftGame).
        },
        [wsClient]
    );

    const leaveAndJoinRef = useRef(leaveAndJoinRoom);
    leaveAndJoinRef.current = leaveAndJoinRoom;

    useEffect(() => {
        const onPendingJoin = (e: Event) => {
            const code = (e as CustomEvent<{ code?: string }>).detail?.code;
            if (code && typeof code === 'string') {
                try {
                    sessionStorage.removeItem(TANKS_PENDING_JOIN_ROOM_STORAGE_KEY);
                } catch {
                    /* ignore */
                }
                leaveAndJoinRef.current(code);
            }
        };
        window.addEventListener(TANKS_PENDING_JOIN_ROOM_EVENT, onPendingJoin as EventListener);
        try {
            const storedCode = sessionStorage.getItem(TANKS_PENDING_JOIN_ROOM_STORAGE_KEY);
            if (storedCode) {
                sessionStorage.removeItem(TANKS_PENDING_JOIN_ROOM_STORAGE_KEY);
                window.setTimeout(() => leaveAndJoinRef.current(storedCode), 0);
            }
        } catch {
            /* ignore */
        }
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

    const handleLeaveGameClick = () => {
        setLeaveConfirmOpen(true);
    };

    const confirmLeaveGame = () => {
        setLeaveConfirmOpen(false);
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

    const cancelLeaveGame = () => {
        setLeaveConfirmOpen(false);
    };

    const rootClassName = [
        'play-page-root',
        `play-page-root--${screen}`,
        screen === 'hub' ? '' : 'app-container'
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={rootClassName}>
            {screen === 'hub' && (
                <PlayHubScreen
                    onCreateRoom={handleCreateRoom}
                    onJoinRoom={handleJoinRoom}
                    error={error}
                    onClearError={() => setError('')}
                    initialSelectedMode={hubInitialMode}
                    hubTab={hubTab}
                    onHubTabChange={setHubTab}
                    wsClient={wsClient}
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
                    onLeaveGame={handleLeaveGameClick}
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

            {leaveConfirmOpen && (
                <div className="leave-confirm-overlay" onClick={cancelLeaveGame}>
                    <div className="leave-confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="leave-confirm-icon">⚠️</div>
                        <h4 className="leave-confirm-title">Покинуть бой?</h4>
                        <p className="leave-confirm-text">
                            Вы собираетесь выйти из текущего боя. Вернуться обратно будет невозможно.
                        </p>
                        <div className="leave-confirm-actions">
                            <button
                                type="button"
                                className="ui-btn ui-btn-secondary"
                                onClick={cancelLeaveGame}
                            >
                                Отмена
                            </button>
                            <button
                                type="button"
                                className="ui-btn ui-btn-primary leave-confirm-danger-btn"
                                onClick={confirmLeaveGame}
                            >
                                Покинуть бой
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlayPage;
