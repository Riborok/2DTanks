import { getApiOrigin } from './apiOrigin';

export interface ReplayListItemDto {
    replayId: string;
    matchId: string;
    title: string;
    isPublic: boolean;
    createdAt: string;
    endedAt: string | null;
    roomCode: string | null;
    winnerRole: string | null;
    matchStatus: string | null;
}

export interface MatchHistoryItemDto {
    matchId: string;
    roomCode: string | null;
    matchStatus: string | null;
    winnerRole: string | null;
    endReason: string | null;
    durationTicks: number | null;
    startedAt: string | null;
    endedAt: string | null;
    role: string;
    isWinner: boolean;
}

export interface ReplayPlaybackMetaDto {
    replayId: string;
    matchId: string;
    title: string;
    isPublic: boolean;
    roomCode: string | null;
    winnerRole: string | null;
    matchStatus: string | null;
    endReason: string | null;
    durationTicks: number | null;
    endedAt: string | null;
}

export interface ReplayFrameDto {
    tick: number;
    world: unknown;
}

export interface ReplayActionDto {
    tick: number;
    playerId: string;
    action: {
        forward: boolean;
        backward: boolean;
        turnLeft: boolean;
        turnRight: boolean;
        turretLeft: boolean;
        turretRight: boolean;
        shoot: boolean;
    };
}

/** События реплея (серверный журнал). */
export type ReplayEventDto =
    | {
          kind: 'world_init';
          tick: number;
          world: unknown;
          spawnOrigin: { x: number; y: number };
          aux?: { elapsedMs: number; ammoSpawnTimer: number; ammoSpawnInterval: number };
      }
    | { kind: 'item_spawn'; tick: number; id: number; x: number; y: number; type: number }
    | { kind: 'player_input'; tick: number; playerId: string; action: ReplayActionDto['action'] };

export interface ReplayStartMetaDto {
    mode: 'standard';
    tickRate: number;
    attackerPlayerId: string;
    defenderPlayerId: string;
    attackerConfig: unknown;
    defenderConfig: unknown;
    rngSeed: number;
}

async function parseJson<T>(res: Response): Promise<T & { error?: string }> {
    return (await res.json()) as T & { error?: string };
}

function headers(token: string): HeadersInit {
    return {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

export async function listReplays(token: string): Promise<{ replays: ReplayListItemDto[] }> {
    const res = await fetch(`${getApiOrigin()}/api/game/replays`, { headers: headers(token) });
    const data = await parseJson<{ replays?: ReplayListItemDto[]; error?: string }>(res);
    if (!res.ok) {
        throw new Error(data.error || 'Не удалось загрузить реплеи');
    }
    return { replays: data.replays ?? [] };
}

export async function listMatchHistory(token: string): Promise<{ matches: MatchHistoryItemDto[] }> {
    const res = await fetch(`${getApiOrigin()}/api/game/matches/history`, { headers: headers(token) });
    const data = await parseJson<{ matches?: MatchHistoryItemDto[]; error?: string }>(res);
    if (!res.ok) {
        throw new Error(data.error || 'Не удалось загрузить историю');
    }
    return { matches: data.matches ?? [] };
}

export async function getReplayPlayback(
    token: string,
    replayId: string
): Promise<{
    meta: ReplayPlaybackMetaDto;
    startMeta: ReplayStartMetaDto;
    actions: ReplayActionDto[];
    events: ReplayEventDto[];
}> {
    const res = await fetch(`${getApiOrigin()}/api/game/replays/${encodeURIComponent(replayId)}/playback`, {
        headers: headers(token)
    });
    const data = await parseJson<{
        meta?: ReplayPlaybackMetaDto;
        startMeta?: ReplayStartMetaDto;
        actions?: ReplayActionDto[];
        events?: ReplayEventDto[];
        error?: string;
    }>(res);
    if (!res.ok) {
        throw new Error(data.error || 'Не удалось загрузить запись');
    }
    if (!data.meta || !data.startMeta) {
        throw new Error('Некорректный ответ сервера');
    }
    return {
        meta: data.meta,
        startMeta: data.startMeta,
        actions: data.actions ?? [],
        events: data.events ?? []
    };
}

export async function patchReplay(
    token: string,
    replayId: string,
    body: { title?: string; isPublic?: boolean }
): Promise<void> {
    const res = await fetch(`${getApiOrigin()}/api/game/replays/${encodeURIComponent(replayId)}`, {
        method: 'PATCH',
        headers: headers(token),
        body: JSON.stringify(body)
    });
    const data = await parseJson<{ error?: string }>(res);
    if (!res.ok) {
        throw new Error(data.error || 'Не удалось сохранить');
    }
}
