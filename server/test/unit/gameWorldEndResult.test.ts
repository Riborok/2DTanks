import {
    resolveDeathmatchWinnerPlayerIds,
    type DeathmatchScore,
    type PlayerMatchStats
} from '../../src/game/world/gameWorldEndResult';

function stats(playerId: string, damageDealt: number): PlayerMatchStats {
    return {
        playerId,
        role: 'fighter',
        kills: 0,
        deaths: 0,
        shotsFired: 0,
        shotsHit: 0,
        damageDealt,
        damageTaken: 0,
        keyPickups: 0,
        ammoPickups: 0
    };
}

describe('resolveDeathmatchWinnerPlayerIds', () => {
    const scoreRows: DeathmatchScore[] = [
        { playerId: 'a', kills: 2 },
        { playerId: 'b', kills: 2 }
    ];

    it('uses damage dealt to break a kills tie', () => {
        expect(resolveDeathmatchWinnerPlayerIds(scoreRows, [stats('a', 90), stats('b', 120)])).toEqual(['b']);
    });

    it('returns no winner when kills and damage dealt are tied', () => {
        expect(resolveDeathmatchWinnerPlayerIds(scoreRows, [stats('a', 120), stats('b', 120)])).toEqual([]);
    });

    it('keeps kills as the primary criterion', () => {
        expect(
            resolveDeathmatchWinnerPlayerIds(
                [
                    { playerId: 'a', kills: 3 },
                    { playerId: 'b', kills: 2 }
                ],
                [stats('a', 10), stats('b', 500)]
            )
        ).toEqual(['a']);
    });

    it('uses damage even when all players have zero kills', () => {
        expect(
            resolveDeathmatchWinnerPlayerIds(
                [
                    { playerId: 'a', kills: 0 },
                    { playerId: 'b', kills: 0 }
                ],
                [stats('a', 30), stats('b', 0)]
            )
        ).toEqual(['a']);
    });
});
