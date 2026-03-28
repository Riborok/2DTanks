import React, { useState } from 'react';

interface ConnectionScreenProps {
    onCreateRoom: () => void;
    /** Создать комнату без защитника — только атакующий, для тестов */
    onCreateSoloTest?: () => void;
    onJoinRoom: (code: string) => void;
    error?: string;
}

const ConnectionScreen: React.FC<ConnectionScreenProps> = ({ onCreateRoom, onCreateSoloTest, onJoinRoom, error }) => {
    const [roomCode, setRoomCode] = useState('');

    const handleJoin = () => {
        if (roomCode.trim().length === 6) {
            onJoinRoom(roomCode.trim().toUpperCase());
        }
    };

    return (
        <div className="connection-screen">
            <div className="connection-container">
                <h1 className="game-title">2D Tanks Online</h1>
                
                <div className="connection-buttons">
                    <button className="connection-button create-button" onClick={onCreateRoom}>
                        Создать игру
                    </button>
                    {onCreateSoloTest && (
                        <button
                            type="button"
                            className="connection-button create-button"
                            onClick={onCreateSoloTest}
                            style={{ marginTop: '10px', opacity: 0.95 }}
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
                            className="connection-button join-button" 
                            onClick={handleJoin}
                            disabled={roomCode.length !== 6}
                        >
                            Присоединиться
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConnectionScreen;
