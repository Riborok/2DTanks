import React from 'react';

interface Player {
    playerId: string;
    role: 'attacker' | 'defender';
    tankConfig?: any;
    ready?: boolean;
}

interface LobbyScreenProps {
    roomId: string;
    myPlayerId: string;
    myRole: 'attacker' | 'defender';
    players: Player[];
    onReady: () => void;
    onCopyCode: () => void;
}

const LobbyScreen: React.FC<LobbyScreenProps> = ({ 
    roomId, 
    myPlayerId, 
    myRole, 
    players, 
    onReady,
    onCopyCode 
}) => {
    const myPlayer = players.find(p => p.playerId === myPlayerId);
    const otherPlayer = players.find(p => p.playerId !== myPlayerId);
    const bothReady = myPlayer?.ready && otherPlayer?.ready;

    // Debug logs
    console.log('LobbyScreen render:', { myPlayerId, players, myPlayer, otherPlayer });

    const handleCopyCode = () => {
        navigator.clipboard.writeText(roomId);
        onCopyCode();
    };

    return (
        <div className="lobby-screen">
            <div className="lobby-container">
                <h1 className="lobby-title">Ожидание игроков</h1>
                
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
                        <h3>Ваша роль: {myRole === 'attacker' ? 'Атакующий' : 'Защитник'}</h3>
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

                    {otherPlayer && (
                        <div className="player-status">
                            <h3>Соперник ({otherPlayer.role === 'attacker' ? 'Атакующий' : 'Защитник'})</h3>
                            <p>Статус: {otherPlayer.tankConfig ? (otherPlayer.ready ? 'Готов' : 'Ожидание готовности') : 'Выбирает танк'}</p>
                        </div>
                    )}

                    {!otherPlayer && (
                        <div className="player-status">
                            <h3>Ожидание второго игрока...</h3>
                        </div>
                    )}
                </div>

                {bothReady && (
                    <div className="game-starting">
                        <p>Оба игрока готовы! Игра начинается...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LobbyScreen;
