import type { TankConfig } from '../../utils/types';

export type DeathmatchInit = {
    surfaceMaterial: number;
    fighters: { playerId: string; config: TankConfig }[];
};

export type GameWorldEndResult =
    | { mode: 'standard'; winner: 'attacker' | 'defender'; reason: string }
    | {
          mode: 'deathmatch';
          reason: string;
          winnerPlayerIds: string[];
          scores: { playerId: string; kills: number }[];
      };
