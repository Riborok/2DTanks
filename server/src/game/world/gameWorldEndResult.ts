import type { TankConfig } from '../../utils/types';

export type DeathmatchInit = {
    surfaceMaterial: number;
    fighters: { playerId: string; config: TankConfig }[];
};

export type GameWorldRuntimeSettings = {
    matchDurationSec?: number | null;
    ammoSpawnIntervalMs?: number;
    backgroundSequence?: number[];
    arenaSurfaceMaterial?: number;
};

export type PlayerMatchStats = {
    playerId: string;
    /** Ник на момент матча (для истории / UI); для старых записей может подставляться с сервера по роли. */
    displayName?: string | null;
    role: 'attacker' | 'defender' | 'fighter';
    kills: number;
    deaths: number;
    shotsFired: number;
    shotsHit: number;
    damageDealt: number;
    damageTaken: number;
    keyPickups: number;
    ammoPickups: number;
};

export type DeathmatchScore = {
    playerId: string;
    kills: number;
    displayName?: string | null;
};

export function resolveDeathmatchWinnerPlayerIds(
    scores: DeathmatchScore[],
    stats: Array<Pick<PlayerMatchStats, 'playerId' | 'damageDealt'>>
): string[] {
    if (scores.length === 0) {
        return [];
    }

    const maxKills = Math.max(...scores.map((score) => score.kills));
    const killLeaders = scores.filter((score) => score.kills === maxKills);
    if (killLeaders.length === 1) {
        return [killLeaders[0].playerId];
    }

    const damageByPlayerId = new Map(stats.map((stat) => [stat.playerId, stat.damageDealt]));
    const maxDamage = Math.max(...killLeaders.map((score) => damageByPlayerId.get(score.playerId) ?? 0));
    const damageLeaders = killLeaders.filter(
        (score) => (damageByPlayerId.get(score.playerId) ?? 0) === maxDamage
    );

    return damageLeaders.length === 1 ? [damageLeaders[0].playerId] : [];
}

export type GameWorldEndResult =
    | { mode: 'standard'; winner: 'attacker' | 'defender'; reason: string; stats: PlayerMatchStats[] }
    | {
      mode: 'deathmatch';
      reason: string;
      winnerPlayerIds: string[];
      scores: DeathmatchScore[];
      stats: PlayerMatchStats[];
  };
