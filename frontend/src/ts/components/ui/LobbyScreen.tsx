import React, { useEffect, useState } from 'react';
import { WebSocketClient } from '../../online/WebSocketClient';
import LobbyChat from './LobbyChat';
import { getFriends, type FriendDto } from '../../auth/gameApi';

interface Player {
    playerId: string;
    role: 'attacker' | 'defender' | 'fighter';
    tankConfig?: any;
    ready?: boolean;
    displayName?: string;
    userId?: string;
}

interface RoomSettings {
    matchDurationSec: number;
    ammoSpawnIntervalSec: number;
    backgroundSequence: number[];
    arenaSurfaceMaterial: number;
}

interface LobbyScreenProps {
    roomId: string;
    myPlayerId: string;
    myRole: 'attacker' | 'defender' | 'fighter';
    players: Player[];
    /** Комната в режиме одного игрока (нет защитника) */
    singlePlayerRoom?: boolean;
    /** Тренировка: два игрока, без записи матча */
    practiceRoom?: boolean;
    /** Deathmatch: 2–5 бойцов, 1 мин, фраги */
    deathmatchRoom?: boolean;
    creatorPlayerId?: string;
    canStart?: boolean;
    roomSettings: RoomSettings;
    onReady: () => void;
    onStartGame: () => void;
    onRoomSettingsChange: (settings: Partial<RoomSettings>) => void;
    onCopyCode: () => void;
    /** Вернуться к экрану выбора режима (покинуть комнату). */
    onLeaveToHub: () => void;
    /** Если передан — в лобби отрисовывается блок чата (не в соло) */
    wsClient?: WebSocketClient;
    /** Для загрузки списка друзей и кнопок «Пригласить» */
    accessToken?: string | null;
    myAuthUserId?: string;
    /** Ошибка с сокета (например от invite:send) */
    serverError?: string;
    onClearServerError?: () => void;
}

const LobbyScreen: React.FC<LobbyScreenProps> = ({ 
    roomId, 
    myPlayerId, 
    myRole, 
    players, 
    singlePlayerRoom = false,
    practiceRoom = false,
    deathmatchRoom = false,
    creatorPlayerId = '',
    canStart = false,
    roomSettings,
    onReady,
    onStartGame,
    onRoomSettingsChange,
    onCopyCode,
    onLeaveToHub,
    wsClient,
    accessToken,
    myAuthUserId,
    serverError,
    onClearServerError
}) => {
    const [friends, setFriends] = useState<FriendDto[]>([]);
    const [friendsLoading, setFriendsLoading] = useState(false);
    const [friendsErr, setFriendsErr] = useState<string | null>(null);
    const [inviteOk, setInviteOk] = useState<string | null>(null);

    useEffect(() => {
        if (!accessToken || singlePlayerRoom) {
            setFriends([]);
            return;
        }
        let cancelled = false;
        setFriendsLoading(true);
        setFriendsErr(null);
        void getFriends(accessToken)
            .then((d) => {
                if (!cancelled) setFriends(d.friends);
            })
            .catch((e) => {
                if (!cancelled) setFriendsErr(e instanceof Error ? e.message : 'Не удалось загрузить друзей');
            })
            .finally(() => {
                if (!cancelled) setFriendsLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [accessToken, singlePlayerRoom]);

    useEffect(() => {
        if (!wsClient) return;
        const onSent = () => {
            setInviteOk('Приглашение отправлено');
            window.setTimeout(() => setInviteOk(null), 2500);
        };
        wsClient.on('invite:sent', onSent as any);
        return () => wsClient.off('invite:sent', onSent as any);
    }, [wsClient]);

    const sendInvite = (targetUserId: string) => {
        if (!wsClient) return;
        wsClient.send({ type: 'invite:send', targetUserId } as any);
    };
    const myPlayer = players.find((p) => p.playerId === myPlayerId);
    const isCreator = myPlayerId === creatorPlayerId;
    const [settingsOpen, setSettingsOpen] = useState(false);
    const otherPlayers = players.filter((p: Player) => p.playerId !== myPlayerId);
    const otherPlayer = otherPlayers[0];
    const bothReady = singlePlayerRoom
        ? myPlayer?.ready === true
        : deathmatchRoom
          ? players.length >= 2 &&
            players.every((p) => p.ready === true && p.tankConfig)
          : Boolean(myPlayer?.ready && otherPlayer?.ready);

    const handleCopyCode = () => {
        navigator.clipboard.writeText(roomId);
        onCopyCode();
    };

    const surfaceNames = ['Трава', 'Грунт', 'Песок'];
    const changeSurface = (index: number, value: number) => {
        const next = [...roomSettings.backgroundSequence];
        next[index] = value;
        onRoomSettingsChange({
            backgroundSequence: next,
            arenaSurfaceMaterial: deathmatchRoom ? value : roomSettings.arenaSurfaceMaterial
        });
    };

    return (
        <div className="lobby-screen">
            <div className="lobby-container">
                <div className="lobby-leave-row">
                    <button
                        type="button"
                        className="ui-btn ui-btn-secondary lobby-leave-btn"
                        onClick={onLeaveToHub}
                    >
                        ← К выбору режима
                    </button>
                </div>
                <h1 className="lobby-title">
                    {singlePlayerRoom
                        ? 'Режим теста (1 игрок)'
                        : deathmatchRoom
                          ? 'Арена: больше фрагов — победа (2–5 игроков)'
                          : practiceRoom
                            ? 'Тренировка (без статистики)'
                            : 'Ожидание игроков'}
                </h1>
                {deathmatchRoom && (
                    <p className="lobby-deathmatch-hint">
                        В комнате {players.length} / 5. Нужно от 2 до 5 участников; все нажимают «Готов», затем создатель запускает матч.
                    </p>
                )}
                
                <div className="lobby-topbar">
                    <div className="room-code-section">
                        <label>Код комнаты:</label>
                        <div className="room-code-display">
                            <span className="room-code">{roomId}</span>
                            <button className="copy-button" onClick={handleCopyCode}>
                                Копировать
                            </button>
                        </div>
                    </div>
                    <div className="lobby-mode-chip">
                        {singlePlayerRoom
                            ? 'Соло'
                            : deathmatchRoom
                              ? 'Арена'
                              : practiceRoom
                                ? 'Тренировка'
                                : 'Классика'}
                </div>
                </div>

                {serverError && (
                    <div className="lobby-server-error" role="alert">
                        <span>{serverError}</span>
                        {onClearServerError && (
                            <button type="button" className="lobby-server-error-dismiss" onClick={onClearServerError}>
                                Закрыть
                            </button>
                        )}
                    </div>
                )}

                <section className="lobby-settings-panel" aria-label="Параметры матча">
                    <div className="lobby-settings-head">
                        <div>
                            <h3>Параметры матча</h3>
                            <span>{isCreator ? 'Вы создатель' : 'Задаёт создатель'}</span>
                        </div>
                        <button
                            type="button"
                            className="lobby-settings-toggle"
                            aria-expanded={settingsOpen}
                            onClick={() => setSettingsOpen((open) => !open)}
                        >
                            {settingsOpen ? 'Скрыть' : 'Показать'}
                        </button>
                    </div>
                    {settingsOpen && (
                        <div className="lobby-settings-grid">
                            <label className="lobby-setting">
                                <span>Длительность, сек</span>
                                <input
                                    type="number"
                                    min={15}
                                    max={600}
                                    step={15}
                                    value={roomSettings.matchDurationSec}
                                    disabled={!isCreator}
                                    onChange={(e) => onRoomSettingsChange({ matchDurationSec: Number(e.target.value) })}
                                />
                            </label>
                            <label className="lobby-setting">
                                <span>Ящики каждые, сек</span>
                                <input
                                    type="number"
                                    min={3}
                                    max={60}
                                    step={1}
                                    value={roomSettings.ammoSpawnIntervalSec}
                                    disabled={!isCreator}
                                    onChange={(e) => onRoomSettingsChange({ ammoSpawnIntervalSec: Number(e.target.value) })}
                                />
                            </label>
                            {(deathmatchRoom ? [0] : [0, 1, 2]).map((idx) => (
                                <label key={idx} className="lobby-setting">
                                    <span>{deathmatchRoom ? 'Поверхность арены' : `Поверхность ${idx + 1}`}</span>
                                    <select
                                        value={roomSettings.backgroundSequence[idx] ?? 0}
                                        disabled={!isCreator}
                                        onChange={(e) => changeSurface(idx, Number(e.target.value))}
                                    >
                                        {surfaceNames.map((name, materialIdx) => (
                                            <option key={materialIdx} value={materialIdx}>
                                                {name}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            ))}
                        </div>
                    )}
                </section>

                <div className="players-status players-status-grid">
                    <div className="player-status player-status-self">
                        <h3>
                            Вы{myPlayer?.displayName ? ` — ${myPlayer.displayName}` : ''}:{' '}
                            {myRole === 'fighter'
                                ? 'Боец'
                                : myRole === 'attacker'
                                  ? 'Атакующий'
                                  : 'Защитник'}
                        </h3>
                        <p>Статус: {
                            !myPlayer 
                                ? 'Загрузка...' 
                                : !myPlayer.tankConfig 
                                    ? 'Выбирает танк' 
                                    : myPlayer.ready === true
                                        ? 'Готов' 
                                        : 'Ожидание готовности'
                        }</p>
                        <div className="lobby-self-actions">
                            {myPlayer?.ready !== true && myPlayer?.tankConfig ? (
                                <button className="ready-button ready-button-prominent" onClick={onReady}>
                                    Готов
                                </button>
                            ) : myPlayer?.ready ? (
                                <span className="lobby-ready-pill">Вы готовы</span>
                            ) : null}
                        </div>
                    </div>

                    {deathmatchRoom
                        ? otherPlayers.map((p) => (
                              <div key={p.playerId} className="player-status">
                                  <h3>
                                      Игрок{p.displayName ? ` — ${p.displayName}` : ''} (боец)
                                  </h3>
                                  <p>
                                      Статус:{' '}
                                      {p.tankConfig
                                          ? p.ready
                                              ? 'Готов'
                                              : 'Ожидание готовности'
                                          : 'Выбирает танк'}
                                  </p>
                              </div>
                          ))
                        : otherPlayer && (
                              <div className="player-status">
                                  <h3>
                                      Соперник
                                      {otherPlayer.displayName ? ` — ${otherPlayer.displayName}` : ''} (
                                      {otherPlayer.role === 'fighter'
                                          ? 'Боец'
                                          : otherPlayer.role === 'attacker'
                                            ? 'Атакующий'
                                            : 'Защитник'})
                                  </h3>
                                  <p>
                                      Статус:{' '}
                                      {otherPlayer.tankConfig
                                          ? otherPlayer.ready
                                              ? 'Готов'
                                              : 'Ожидание готовности'
                                          : 'Выбирает танк'}
                                  </p>
                              </div>
                          )}

                    {!otherPlayer && !singlePlayerRoom && !deathmatchRoom && (
                        <div className="player-status">
                            <h3>Ожидание второго игрока...</h3>
                        </div>
                    )}
                    {deathmatchRoom && players.length < 2 && (
                        <div className="player-status">
                            <h3>Нужен хотя бы второй игрок по коду комнаты…</h3>
                        </div>
                    )}
                    {deathmatchRoom && players.length >= 2 && players.length < 5 && (
                        <div className="player-status">
                            <p>По желанию дождитесь ещё игроков (до 5) или все нажмите «Готов».</p>
                        </div>
                    )}
                    {singlePlayerRoom && (
                        <div className="player-status">
                            <p>Защитник не подключается. Нажмите «Готов», чтобы начать.</p>
                        </div>
                    )}
                </div>

                <div className="lobby-secondary">
                    {!singlePlayerRoom && accessToken && wsClient && (
                        <div className="lobby-invite-block">
                            <h3 className="lobby-invite-title">Пригласить друга в эту комнату</h3>
                            <p className="lobby-invite-hint">Уведомление придёт по WebSocket всем вкладкам друга.</p>
                            {inviteOk && <p className="lobby-invite-ok">{inviteOk}</p>}
                            {friendsErr && <p className="lobby-invite-error">{friendsErr}</p>}
                            {friendsLoading && <p className="lobby-invite-loading">Загрузка списка друзей…</p>}
                            {!friendsLoading && !friendsErr && friends.length === 0 && (
                                <p className="lobby-invite-empty">Пока нет друзей — добавьте их в разделе «Друзья».</p>
                            )}
                            {!friendsLoading && friends.length > 0 && (
                                <div className="lobby-invite-list-scroll">
                                    <ul className="lobby-invite-list">
                                        {friends.map((f) => {
                                            const inRoom = players.some((p) => p.userId && p.userId === f.userId);
                                            const isSelf = myAuthUserId && f.userId === myAuthUserId;
                                            return (
                                                <li key={f.userId} className="lobby-invite-row">
                                                    <span className="lobby-invite-name">
                                                        {f.displayName || f.login}
                                                        <span className="lobby-invite-login">@{f.login}</span>
                                                    </span>
                                                    <button
                                                        type="button"
                                                        className="lobby-invite-btn"
                                                        disabled={inRoom || Boolean(isSelf)}
                                                        title={inRoom ? 'Уже в комнате' : undefined}
                                                        onClick={() => sendInvite(f.userId)}
                                                    >
                                                        Пригласить
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {!singlePlayerRoom && wsClient && (
                        <LobbyChat wsClient={wsClient} myPlayerId={myPlayerId} />
                    )}

                    {bothReady && isCreator && (
                        <div className="game-starting">
                            <button
                                type="button"
                                className="lobby-start-button"
                                onClick={onStartGame}
                                disabled={!canStart}
                            >
                                Запустить матч
                            </button>
                        </div>
                    )}

                    {bothReady && !isCreator && (
                        <div className="game-starting">
                            <p className="lobby-wait-start-text">Все готовы. Ждём запуска от создателя комнаты.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LobbyScreen;
