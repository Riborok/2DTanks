import React, { useState } from 'react';

type GameMode = 'standard' | 'practice' | 'deathmatch' | 'solo';

interface ModeCard {
    mode: GameMode;
    title: string;
    desc: string;
    badge?: string;
}

const MODES: ModeCard[] = [
    {
        mode: 'deathmatch',
        title: 'Арена',
        desc: 'FFA до 5 бойцов, 1 минута, побеждает лидер по фрагам.',
        badge: 'популярно'
    },
    {
        mode: 'standard',
        title: 'Классика',
        desc: 'Атакующий vs Защитник: собери ключи и доберись до базы.'
    },
    {
        mode: 'practice',
        title: 'Тренировка',
        desc: '2 игрока, без записи статистики и без лимита времени.'
    },
    {
        mode: 'solo',
        title: 'Соло',
        desc: 'Один игрок против компьютера — для проверки механик.'
    }
];

interface PlayHubScreenProps {
    onCreateRoom: (mode: GameMode) => void;
    onJoinRoom: (code: string) => void;
    error?: string;
}

const PlayHubScreen: React.FC<PlayHubScreenProps> = ({ onCreateRoom, onJoinRoom, error }) => {
    const [roomCode, setRoomCode] = useState('');
    const [selected, setSelected] = useState<GameMode>('deathmatch');

    const handleJoin = () => {
        const code = roomCode.trim().toUpperCase();
        if (code.length === 6) {
            onJoinRoom(code);
        }
    };

    return (
        <div className="page-play-hub connection-screen">
            <div className="connection-container">
                <div className="playhub-header">
                    <h1 className="game-title">2D Танки</h1>
                    <p className="page-subtitle">
                        Выбери режим, создай комнату и пригласи друзей по коду.
                    </p>
                </div>

                <div className="playhub-layout">
                    <section className="playhub-main">
                        {/* Выбор режима */}
                        <div className="playhub-mode-grid">
                            {MODES.map(({ mode, title, desc, badge }) => (
                                <button
                                    key={mode}
                                    type="button"
                                    className={`playhub-mode-card card${selected === mode ? ' playhub-mode-card--active' : ''}`}
                                    onClick={() => setSelected(mode)}
                                >
                                    {badge && (
                                        <span className="playhub-mode-badge">{badge}</span>
                                    )}
                                    <strong>{title}</strong>
                                    <span>{desc}</span>
                                </button>
                            ))}
                        </div>

                        <div className="playhub-quick-start">
                            <button
                                type="button"
                                className="connection-button create-button playhub-primary-cta"
                                onClick={() => onCreateRoom(selected)}
                            >
                                Создать комнату — {MODES.find((m) => m.mode === selected)?.title}
                            </button>
                            <span className="playhub-quick-hint">
                                Поделись шестизначным кодом из лобби, чтобы друзья присоединились.
                            </span>
                        </div>
                    </section>

                    <aside className="playhub-side">
                        <div className="playhub-join-card">
                            <div className="playhub-join-title">Войти по коду</div>
                            <div className="join-section">
                                <input
                                    type="text"
                                    className="room-code-input"
                                    placeholder="Код комнаты"
                                    value={roomCode}
                                    onChange={(e) =>
                                        setRoomCode(e.target.value.toUpperCase().slice(0, 6))
                                    }
                                    onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                                    maxLength={6}
                                    autoComplete="off"
                                    autoCapitalize="characters"
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
                            <p className="playhub-side-note">
                                Код из 6 символов — режим определяет создатель комнаты.
                            </p>
                        </div>

                        <div className="playhub-tips-card">
                            <h3>Совет</h3>
                            <p>
                                {selected === 'deathmatch' &&
                                    'В Арене фраг засчитывается за уничтожение любого игрока. Собирай аптечки и боеприпасы!'}
                                {selected === 'standard' &&
                                    'Атакующий собирает ключи, защитник охраняет базу. Побеждает тот, кто выполнил свою роль до конца.'}
                                {selected === 'practice' &&
                                    'Тренировка идеальна для отработки позиций и управления без давления рейтинга.'}
                                {selected === 'solo' &&
                                    'Соло-режим создаёт комнату без защитника — можно изучить карту одному.'}
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
