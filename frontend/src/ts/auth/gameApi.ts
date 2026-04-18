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
    matchStats: Array<{
        playerId: string;
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
    }>;
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

export type ReplayStartMetaDto =
    | {
          mode: 'standard';
          tickRate: number;
          attackerPlayerId: string;
          defenderPlayerId: string;
          attackerConfig: unknown;
          defenderConfig: unknown;
          rngSeed: number;
      }
    | {
          mode: 'deathmatch';
          tickRate: number;
          rngSeed: number;
          surfaceMaterial: number;
          fighters: { playerId: string; config: unknown }[];
      };

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
    playerNames: Record<string, string>;
}> {
    const res = await fetch(`${getApiOrigin()}/api/game/replays/${encodeURIComponent(replayId)}/playback`, {
        headers: headers(token)
    });
    const data = await parseJson<{
        meta?: ReplayPlaybackMetaDto;
        startMeta?: ReplayStartMetaDto;
        actions?: ReplayActionDto[];
        events?: ReplayEventDto[];
        playerNames?: Record<string, string>;
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
        events: data.events ?? [],
        playerNames: data.playerNames ?? {}
    };
}

export interface TankPresetDto {
    presetId: string;
    name: string;
    color: number;
    hullNum: number;
    trackNum: number;
    turretNum: number;
    weaponNum: number;
    createdAt: string;
    updatedAt: string;
}

export interface TankPresetInputDto {
    name: string;
    color: number;
    hullNum: number;
    trackNum: number;
    turretNum: number;
    weaponNum: number;
}

export async function listTankPresets(token: string): Promise<{ presets: TankPresetDto[] }> {
    const res = await fetch(`${getApiOrigin()}/api/game/tank-presets`, { headers: headers(token) });
    const data = await parseJson<{ presets?: TankPresetDto[]; error?: string }>(res);
    if (!res.ok) {
        throw new Error(data.error || 'Не удалось загрузить сеты');
    }
    return { presets: data.presets ?? [] };
}

export async function createTankPreset(
    token: string,
    input: TankPresetInputDto
): Promise<{ preset: TankPresetDto }> {
    const res = await fetch(`${getApiOrigin()}/api/game/tank-presets`, {
        method: 'POST',
        headers: headers(token),
        body: JSON.stringify(input)
    });
    const data = await parseJson<{ preset?: TankPresetDto; error?: string }>(res);
    if (!res.ok || !data.preset) {
        throw new Error(data.error || 'Не удалось сохранить сет');
    }
    return { preset: data.preset };
}

export async function updateTankPreset(
    token: string,
    presetId: string,
    input: TankPresetInputDto
): Promise<{ preset: TankPresetDto }> {
    const res = await fetch(
        `${getApiOrigin()}/api/game/tank-presets/${encodeURIComponent(presetId)}`,
        {
            method: 'PUT',
            headers: headers(token),
            body: JSON.stringify(input)
        }
    );
    const data = await parseJson<{ preset?: TankPresetDto; error?: string }>(res);
    if (!res.ok || !data.preset) {
        throw new Error(data.error || 'Не удалось обновить сет');
    }
    return { preset: data.preset };
}

export async function deleteTankPreset(token: string, presetId: string): Promise<void> {
    const res = await fetch(
        `${getApiOrigin()}/api/game/tank-presets/${encodeURIComponent(presetId)}`,
        {
            method: 'DELETE',
            headers: headers(token)
        }
    );
    const data = await parseJson<{ error?: string }>(res);
    if (!res.ok) {
        throw new Error(data.error || 'Не удалось удалить сет');
    }
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
