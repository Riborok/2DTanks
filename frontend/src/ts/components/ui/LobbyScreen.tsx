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

interface LobbyScreenProps {
    roomId: string;
    myPlayerId: string;
    myRole: 'attacker' | 'defender' | 'fighter';
    players: Player[];
    /** Комната в режиме одного игрока (нет защитника) */
    singlePlayerRoom?: boolean;
    /** Тренировка: два игрока, без записи матча и без лимита времени */
    practiceRoom?: boolean;
    /** Deathmatch: 2–5 бойцов, 1 мин, фраги */
    deathmatchRoom?: boolean;
    onReady: () => void;
    onCopyCode: () => void;
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
    onReady,
    onCopyCode,
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

    return (
        <div className="lobby-screen">
            <div className="lobby-container">
                <h1 className="lobby-title">
                    {singlePlayerRoom
                        ? 'Режим теста (1 игрок)'
                        : deathmatchRoom
                          ? 'Арена: 1 минута, больше фрагов — победа (2–5 игроков)'
                          : practiceRoom
                            ? 'Тренировка (без статистики, без лимита времени)'
                            : 'Ожидание игроков'}
                </h1>
                {deathmatchRoom && (
                    <p className="lobby-deathmatch-hint">
                        В комнате {players.length} / 5. Нужно от 2 до 5 участников; все нажимают «Готов» — старт.
                        Поверхность карты случайная.
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
                        )}
                    </div>
                )}

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

                {!singlePlayerRoom && wsClient && (
                    <LobbyChat wsClient={wsClient} myPlayerId={myPlayerId} />
                )}

                {bothReady && (
                    <div className="game-starting">
                        <p>
                            {singlePlayerRoom
                                ? 'Игра начинается...'
                                : deathmatchRoom
                                  ? 'Все готовы! Матч начинается...'
                                  : 'Оба игрока готовы! Игра начинается...'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LobbyScreen;
