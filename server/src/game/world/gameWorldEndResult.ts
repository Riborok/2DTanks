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

export type GameWorldEndResult =
    | { mode: 'standard'; winner: 'attacker' | 'defender'; reason: string; stats: PlayerMatchStats[] }
    | {
      mode: 'deathmatch';
      reason: string;
      winnerPlayerIds: string[];
      scores: { playerId: string; kills: number; displayName?: string | null }[];
      stats: PlayerMatchStats[];
  };
