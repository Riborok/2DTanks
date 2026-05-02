import { GameWorld } from './GameWorld';
import type {
    ReplayActionEvent,
    ReplayActionsRow,
    ReplayEvent,
    ReplayItemSpawnEvent,
    ReplayStartMeta,
    ReplayWorldInitEvent
} from '../../repos/replayRepo';
import { replayEventsToActionRows } from '../../repos/replayRepo';

export type ReplayFrame = { tick: number; world: unknown };

const FALLBACK_TICK_RATE = 60;
/** Снимок на каждый тик, чтобы replay-визуал (включая гусеницы) совпадал с live-игрой. */
const SNAPSHOT_STEP_TICKS = 1;

function isWorldInit(e: ReplayEvent): e is ReplayWorldInitEvent {
    return e.kind === 'world_init';
}

function isItemSpawn(e: ReplayEvent): e is ReplayItemSpawnEvent {
    return e.kind === 'item_spawn';
}

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

function groupItemSpawnsByTick(events: ReplayEvent[]): Map<number, ReplayItemSpawnEvent[]> {
    const byTick = new Map<number, ReplayItemSpawnEvent[]>();
    for (const e of events) {
        if (!isItemSpawn(e)) {
            continue;
        }
        const tick = Math.max(0, Math.floor(e.tick));
        const bucket = byTick.get(tick);
        if (bucket) {
            bucket.push(e);
        } else {
            byTick.set(tick, [e]);
        }
    }
    return byTick;
}

function createWorldFromReplayMeta(meta: ReplayStartMeta): GameWorld {
    if (meta.mode === 'deathmatch') {
        const f0 = meta.fighters[0];
        const cfg0 = f0?.config ?? { hullNum: 0, trackNum: 0, turretNum: 0, weaponNum: 0, color: 0 };
        return new GameWorld(
            cfg0,
            cfg0,
            'replay',
            false,
            false,
            {
                surfaceMaterial: meta.surfaceMaterial,
                fighters: meta.fighters
            },
            meta.rngSeed
        );
    }
    return new GameWorld(
        meta.attackerConfig,
        meta.defenderConfig,
        'replay',
        false,
        false,
        undefined,
        meta.rngSeed
    );
}

/** Старые записи без events / world_init — чистая симуляция по сиду и вводу. */
function buildReplayFramesLegacy(row: ReplayActionsRow): ReplayFrame[] {
    const meta = row.startMeta;
    const tickRate = meta.tickRate > 0 ? meta.tickRate : FALLBACK_TICK_RATE;
    const stepMs = 1000 / tickRate;
    const actionsByTick = groupActionsByTick(row.actions);
    const maxActionTick = row.actions.reduce((m, a) => Math.max(m, a.tick ?? 0), 0);
    const targetTicks = Math.max(row.durationTicks ?? 0, maxActionTick + 1);

    const world = createWorldFromReplayMeta(meta);
    if (meta.mode === 'standard') {
        world.setPlayerTankMapping(meta.attackerPlayerId, meta.defenderPlayerId);
    }

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

/** Реплей по журналу: world_init → симуляция с подстановкой item_spawn из записи. */
function buildReplayFramesFromEventLog(row: ReplayActionsRow): ReplayFrame[] {
    const meta = row.startMeta;
    const events = row.events!;
    const worldInits = events.filter(isWorldInit).sort((a, b) => a.tick - b.tick);
    if (worldInits.length === 0) {
        return buildReplayFramesLegacy(row);
    }

    const tickRate = meta.tickRate > 0 ? meta.tickRate : FALLBACK_TICK_RATE;
    const stepMs = 1000 / tickRate;
    const actions = replayEventsToActionRows(events);
    const actionsByTick = groupActionsByTick(actions);
    const itemSpawnsByTick = groupItemSpawnsByTick(events);

    const maxActionTick = actions.reduce((m, a) => Math.max(m, a.tick ?? 0), 0);
    const maxEventTick = events.reduce((m, e) => Math.max(m, e.tick ?? 0), 0);
    const targetTicks = Math.max(row.durationTicks ?? 0, maxActionTick + 1, maxEventTick + 1);

    const world = createWorldFromReplayMeta(meta);
    const attackerId = meta.mode === 'standard' ? meta.attackerPlayerId : '';
    const defenderId = meta.mode === 'standard' ? meta.defenderPlayerId : '';
    if (meta.mode === 'standard') {
        world.setPlayerTankMapping(meta.attackerPlayerId, meta.defenderPlayerId);
    }

    const firstInit = worldInits[0];
    world.applyReplayWorldInitForPlayback(firstInit, attackerId, defenderId);
    world.configureReplayPlaybackFromEvents(itemSpawnsByTick, true);

    const frames: ReplayFrame[] = [{ tick: world.getTick(), world: world.getSnapshot() }];

    for (let tick = 0; tick < targetTicks; tick++) {
        for (let i = 1; i < worldInits.length; i++) {
            const wi = worldInits[i];
            if (Math.floor(wi.tick) === tick) {
                world.applyReplayWorldInitForPlayback(wi, attackerId, defenderId);
                world.configureReplayPlaybackFromEvents(itemSpawnsByTick, true);
            }
        }
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

export function buildReplayFramesFromActions(row: ReplayActionsRow): ReplayFrame[] {
    if (row.events && row.events.length > 0 && row.events.some(isWorldInit)) {
        return buildReplayFramesFromEventLog(row);
    }
    return buildReplayFramesLegacy(row);
}
