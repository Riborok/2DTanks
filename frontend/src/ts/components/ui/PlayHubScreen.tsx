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
                <div className="playhub-header">
                    <h1 className="game-title">Игра онлайн</h1>
                    <p className="page-subtitle">
                        Выберите формат матча и стартуйте за пару кликов.
                    </p>
                </div>

                <div className="playhub-layout">
                    <section className="playhub-main">
                        <div className="playhub-quick-start">
                            <button
                                type="button"
                                className="connection-button create-button playhub-primary-cta"
                                onClick={onCreateRoom}
                            >
                                Быстрый старт: Классика (2 игрока)
                            </button>
                            <span className="playhub-quick-hint">
                                Рейтинговый матч с сохранением статистики и реплея.
                            </span>
                        </div>

                        <div className="playhub-mode-grid">
                            {onCreateDeathmatchRoom && (
                                <button
                                    type="button"
                                    className="connection-button secondary-outline playhub-mode-card"
                                    onClick={onCreateDeathmatchRoom}
                                    title="Случайная поверхность, без ролей, победа по фрагам за 60 секунд"
                                >
                                    <strong>Арена</strong>
                                    <span>Динамичный бой на 1 минуту, 2-5 игроков.</span>
                                </button>
                            )}
                            {onCreatePracticeRoom && (
                                <button
                                    type="button"
                                    className="connection-button secondary-outline playhub-mode-card"
                                    onClick={onCreatePracticeRoom}
                                    title="Два игрока, без лимита 5 мин и без сохранения в БД"
                                >
                                    <strong>Тренировка</strong>
                                    <span>2 игрока, без записи в статистику.</span>
                                </button>
                            )}
                            {onCreateSoloTest && (
                                <button
                                    type="button"
                                    className="connection-button secondary-outline playhub-mode-card"
                                    onClick={onCreateSoloTest}
                                >
                                    <strong>Соло-тест</strong>
                                    <span>Проверка управления и сборки танка.</span>
                                </button>
                            )}
                        </div>
                    </section>

                    <aside className="playhub-side">
                        <div className="playhub-join-card">
                            <div className="playhub-join-title">Вход в комнату</div>
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
                                    Войти
                                </button>
                            </div>
                            <p className="playhub-side-note">Код состоит из 6 символов.</p>
                        </div>
                        <div className="playhub-tips-card">
                            <h3>Рекомендация</h3>
                            <p>
                                Для честного соревновательного матча выбирай «Классика». Для быстрых боев с друзьями -
                                «Арена».
                            </p>
                        </div>
                    </aside>
                </div>

                {error && <div className="error-message">{error}</div>}
            </div>
        </div>
    );
};

export default PlayHubScreen;
