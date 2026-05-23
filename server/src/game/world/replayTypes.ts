import type { TankConfig } from '../../utils/types';

export type ReplayAction = {
    forward: boolean;
    backward: boolean;
    turnLeft: boolean;
    turnRight: boolean;
    turretLeft: boolean;
    turretRight: boolean;
    shoot: boolean;
};

export type ReplayActionEvent = {
    tick: number;
    playerId: string;
    action: ReplayAction;
};

export type ReplayWorldInitEvent = {
    kind: 'world_init';
    tick: number;
    world: unknown;
    spawnOrigin: { x: number; y: number };
    aux?: { elapsedMs: number; ammoSpawnTimer: number; ammoSpawnInterval: number };
};

export type ReplayItemSpawnEvent = {
    kind: 'item_spawn';
    tick: number;
    id: number;
    x: number;
    y: number;
    type: number;
};

export type ReplayPlayerInputEvent = {
    kind: 'player_input';
    tick: number;
    playerId: string;
    action: ReplayAction;
};

export type ReplayEvent = ReplayWorldInitEvent | ReplayItemSpawnEvent | ReplayPlayerInputEvent;

export function isReplayPlayerInput(event: ReplayEvent): event is ReplayPlayerInputEvent {
    return event.kind === 'player_input';
}

export function replayEventsToActionRows(events: ReplayEvent[]): ReplayActionEvent[] {
    return events
        .filter(isReplayPlayerInput)
        .map((event) => ({ tick: event.tick, playerId: event.playerId, action: event.action }));
}

export type ReplayStartMeta =
    | {
          mode: 'standard';
          tickRate: number;
          attackerPlayerId: string;
          defenderPlayerId: string;
          attackerConfig: TankConfig;
          defenderConfig: TankConfig;
          rngSeed: number;
      }
    | {
          mode: 'deathmatch';
          tickRate: number;
          rngSeed: number;
          surfaceMaterial: number;
          fighters: { playerId: string; config: TankConfig }[];
      };

export type ReplayActionsRow = {
    startMeta: ReplayStartMeta;
    actions: ReplayActionEvent[];
    durationTicks: number | null;
    events: ReplayEvent[] | null;
};
