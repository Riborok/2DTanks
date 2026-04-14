import { GameWorld } from './GameWorld';
import type { ReplayActionEvent, ReplayActionsRow } from '../../repos/replayRepo';

export type ReplayFrame = { tick: number; world: unknown };

const FALLBACK_TICK_RATE = 60;
const SNAPSHOT_STEP_TICKS = 20;

function groupActionsByTick(actions: ReplayActionEvent[]): Map<number, ReplayActionEvent[]> {
    const byTick = new Map<number, ReplayActionEvent[]>();
    for (const evt of actions) {
        const tick = Number.isFinite(evt.tick) ? Math.max(0, Math.floor(evt.tick)) : 0;
        const bucket = byTick.get(tick);
        if (bucket) {
            bucket.push(evt);
        } else {
            byTick.set(tick, [evt]);
        }
    }
    return byTick;
}

export function buildReplayFramesFromActions(row: ReplayActionsRow): ReplayFrame[] {
    const meta = row.startMeta;
    if (meta.mode !== 'standard') {
        return [];
    }

    const tickRate = meta.tickRate > 0 ? meta.tickRate : FALLBACK_TICK_RATE;
    const stepMs = 1000 / tickRate;
    const actionsByTick = groupActionsByTick(row.actions);
    const maxActionTick = row.actions.reduce((m, a) => Math.max(m, a.tick ?? 0), 0);
    const targetTicks = Math.max(row.durationTicks ?? 0, maxActionTick + 1);

    const world = new GameWorld(
        meta.attackerConfig,
        meta.defenderConfig,
        'replay',
        false,
        false,
        undefined,
        meta.rngSeed
    );
    world.setPlayerTankMapping(meta.attackerPlayerId, meta.defenderPlayerId);

    const frames: ReplayFrame[] = [{ tick: 0, world: world.getSnapshot() }];
    for (let tick = 0; tick < targetTicks; tick++) {
        const list = actionsByTick.get(tick) ?? [];
        for (const evt of list) {
            world.handlePlayerAction(evt.playerId, evt.action, stepMs);
        }
        world.update(stepMs);
        const currentTick = world.getTick();
        if (currentTick % SNAPSHOT_STEP_TICKS === 0) {
            frames.push({ tick: currentTick, world: world.getSnapshot() });
        }
    }
    return frames;
}
