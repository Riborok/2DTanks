import React from 'react';

interface Player {
    playerId: string;
    role: 'attacker' | 'defender' | 'fighter';
    tankConfig?: any;
    ready?: boolean;
    displayName?: string;
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
    onCopyCode 
}) => {
    const myPlayer = players.find((p) => p.playerId === myPlayerId);
    const otherPlayers = players.filter((p: Player) => p.playerId !== myPlayerId);
    const otherPlayer = otherPlayers[0];
    const bothReady = singlePlayerRoom
        ? myPlayer?.ready === true
        : deathmatchRoom
          ? players.length >= 2 &&
            players.every((p) => p.ready === true && p.tankConfig)
          : Boolean(myPlayer?.ready && otherPlayer?.ready);

    // Debug logs
    console.log('LobbyScreen render:', { myPlayerId, players, myPlayer, otherPlayer });

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
                    <p className="lobby-deathmatch-hint" style={{ color: 'rgba(255,255,255,0.75)', marginTop: 8 }}>
                        В комнате {players.length} / 5. Нужно от 2 до 5 участников; все нажимают «Готов» — старт.
                        Поверхность карты случайная.
                    </p>
                )}
                
                <div className="room-code-section">
                    <label>Код комнаты:</label>
                    <div className="room-code-display">
                        <span className="room-code">{roomId}</span>
                        <button className="copy-button" onClick={handleCopyCode}>
                            Копировать
                        </button>
                    </div>
                </div>

                <div className="players-status">
                    <div className="player-status">
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
                        {myPlayer?.ready !== true && myPlayer?.tankConfig && (
                            <button 
                                className="ready-button" 
                                onClick={onReady}
                                style={{
                                    padding: '10px 30px',
                                    fontSize: '18px',
                                    backgroundColor: '#4CAF50',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    marginTop: '10px'
                                }}
                            >
                                Готов
                            </button>
                        )}
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
