import React from 'react';

export type DeathmatchScoreRow = { playerId: string; kills: number; displayName?: string };

export interface GameEndScreenProps {
    onBackToMenu: () => void;
    mode: 'standard' | 'deathmatch';
    reason: string;
    winner?: 'attacker' | 'defender';
    myRole?: 'attacker' | 'defender' | 'fighter';
    scores?: DeathmatchScoreRow[];
    winnerPlayerIds?: string[];
    myPlayerId?: string;
}

const GameEndScreen: React.FC<GameEndScreenProps> = ({
    onBackToMenu,
    mode,
    reason,
    winner,
    myRole,
    scores = [],
    winnerPlayerIds = [],
    myPlayerId
}) => {
    if (mode === 'deathmatch') {
        const sorted = [...scores].sort((a, b) => b.kills - a.kills);
        const iWon = myPlayerId && winnerPlayerIds.includes(myPlayerId);
        return (
            <div className="game-end-screen">
                <h1>{iWon ? 'Победа!' : winnerPlayerIds.length ? 'Матч окончен' : 'Матч прерван'}</h1>
                <p className="game-end-reason">Итог: больше всего фрагов за 1 минуту. Причина: {reason}</p>
                <ul className="game-end-scoreboard" style={{ listStyle: 'none', padding: 0, margin: '16px 0' }}>
                    {sorted.map((row) => (
                        <li
                            key={row.playerId}
                            style={{
                                padding: '6px 0',
                                fontWeight: winnerPlayerIds.includes(row.playerId) ? 700 : 400
                            }}
                        >
                            {row.displayName ?? row.playerId.slice(0, 12)} — {row.kills}{' '}
                            {winnerPlayerIds.includes(row.playerId) ? '★' : ''}
                        </li>
                    ))}
                </ul>
                <button type="button" onClick={onBackToMenu}>
                    Вернуться в меню
                </button>
            </div>
        );
    }

    const w = winner ?? 'defender';
    const r = myRole ?? 'attacker';
    return (
        <div className="game-end-screen">
            <h1>{w === r ? 'Победа!' : 'Поражение'}</h1>
            <p>Причина: {reason}</p>
            <button type="button" onClick={onBackToMenu}>
                Вернуться в меню
            </button>
        </div>
    );
};

export default GameEndScreen;
