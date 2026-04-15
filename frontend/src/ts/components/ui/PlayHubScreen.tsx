import React, { useState } from 'react';

interface PlayHubScreenProps {
    onCreateRoom: () => void;
    onCreateDeathmatchRoom?: () => void;
    onCreatePracticeRoom?: () => void;
    onCreateSoloTest?: () => void;
    onJoinRoom: (code: string) => void;
    error?: string;
}

const PlayHubScreen: React.FC<PlayHubScreenProps> = ({
    onCreateRoom,
    onCreateDeathmatchRoom,
    onCreatePracticeRoom,
    onCreateSoloTest,
    onJoinRoom,
    error
}) => {
    const [roomCode, setRoomCode] = useState('');

    const handleJoin = () => {
        if (roomCode.trim().length === 6) {
            onJoinRoom(roomCode.trim().toUpperCase());
        }
    };

    return (
        <div className="page-play-hub connection-screen">
            <div className="connection-container">
                <h1 className="game-title">Игра онлайн</h1>
                <p className="page-subtitle">
                    Обычный матч, тренировка (без записи в статистику), соло-тест или ввод кода комнаты.
                </p>

                <div className="connection-buttons">
                    <button type="button" className="connection-button create-button" onClick={onCreateRoom}>
                        Классика (ключи, 2 игрока)
                    </button>
                    {onCreateDeathmatchRoom && (
                        <button
                            type="button"
                            className="connection-button secondary-outline"
                            onClick={onCreateDeathmatchRoom}
                            title="Случайная поверхность, без ролей, победа по фрагам за 60 секунд"
                        >
                            Арена (1 мин, фраги, 2–5 игроков)
                        </button>
                    )}
                    {onCreatePracticeRoom && (
                        <button
                            type="button"
                            className="connection-button secondary-outline"
                            onClick={onCreatePracticeRoom}
                            title="Два игрока, без лимита 5 мин и без сохранения в БД"
                        >
                            Тренировка (2 игрока)
                        </button>
                    )}
                    {onCreateSoloTest && (
                        <button
                            type="button"
                            className="connection-button create-button solo"
                            onClick={onCreateSoloTest}
                        >
                            Тест: 1 игрок (без защитника)
                        </button>
                    )}

                    <div className="join-section">
                        <input
                            type="text"
                            className="room-code-input"
                            placeholder="Код комнаты"
                            value={roomCode}
                            onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 6))}
                            onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
                            maxLength={6}
                        />
                        <button
                            type="button"
                            className="connection-button join-button"
                            onClick={handleJoin}
                            disabled={roomCode.length !== 6}
                        >
                            Присоединиться
                        </button>
                    </div>
                </div>

                {error && <div className="error-message">{error}</div>}
            </div>
        </div>
    );
};

export default PlayHubScreen;
