/**
 * Симуляция реплея в браузере из тех же модулей, что и на сервере (без сохранённых кадров в БД).
 */
import { buildReplayFramesFromActions } from '../../../../server/src/game/world/replaySimulator';
import type { ReplayActionsRow } from '../../../../server/src/repos/replayRepo';
import type { ReplayActionDto, ReplayEventDto, ReplayStartMetaDto } from '../auth/gameApi';

export type ClientReplayFrame = { tick: number; world: unknown };

export function buildReplayFramesClient(params: {
    startMeta: ReplayStartMetaDto;
    actions: ReplayActionDto[];
    events?: ReplayEventDto[] | null;
    durationTicks: number | null;
}): ClientReplayFrame[] {
    const ev = params.events;
    const events =
        Array.isArray(ev) && ev.length > 0 ? (ev as unknown as ReplayActionsRow['events']) : null;
    const row: ReplayActionsRow = {
        startMeta: params.startMeta as ReplayActionsRow['startMeta'],
        actions: params.actions as ReplayActionsRow['actions'],
        durationTicks: params.durationTicks,
        events
    };
    return buildReplayFramesFromActions(row) as ClientReplayFrame[];
}
