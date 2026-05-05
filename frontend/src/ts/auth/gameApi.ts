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

export async function shareReplay(token: string, replayId: string): Promise<{ slug: string }> {
    const res = await fetch(
        `${getApiOrigin()}/api/game/replays/${encodeURIComponent(replayId)}/share`,
        { method: 'POST', headers: headers(token) }
    );
    const data = await parseJson<{ slug?: string; error?: string }>(res);
    if (!res.ok || !data.slug) {
        throw new Error(data.error || 'Не удалось получить ссылку');
    }
    return { slug: data.slug };
}

export async function revokeReplayShare(token: string, replayId: string): Promise<void> {
    const res = await fetch(
        `${getApiOrigin()}/api/game/replays/${encodeURIComponent(replayId)}/share`,
        { method: 'DELETE', headers: headers(token) }
    );
    if (!res.ok) {
        const data = await parseJson<{ error?: string }>(res);
        throw new Error(data.error || 'Не удалось отозвать ссылку');
    }
}

export async function getPublicReplayPlayback(slug: string): Promise<{
    meta: ReplayPlaybackMetaDto;
    startMeta: ReplayStartMetaDto;
    actions: ReplayActionDto[];
    events: ReplayEventDto[];
    playerNames: Record<string, string>;
}> {
    const res = await fetch(
        `${getApiOrigin()}/api/public/replays/by-slug/${encodeURIComponent(slug)}/playback`
    );
    const data = await parseJson<{
        meta?: ReplayPlaybackMetaDto;
        startMeta?: ReplayStartMetaDto;
        actions?: ReplayActionDto[];
        events?: ReplayEventDto[];
        playerNames?: Record<string, string>;
        error?: string;
    }>(res);
    if (!res.ok || !data.meta || !data.startMeta) {
        throw new Error(data.error || 'Не удалось загрузить запись');
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

// ====== FRIENDS ======

export type FriendshipStatus = 'pending' | 'accepted' | 'blocked';

export interface FriendDto {
    userId: string;
    login: string;
    displayName: string | null;
    status: FriendshipStatus;
    requestedByMe: boolean;
    createdAt: string;
    isOnline?: boolean;
}

export interface FriendsListDto {
    friends: FriendDto[];
    incoming: FriendDto[];
    outgoing: FriendDto[];
    blocked: FriendDto[];
}

export type DashboardMode = 'standard' | 'practice' | 'deathmatch' | 'solo';

export interface DashboardResumePayloadDto {
    roomCode: string;
    mode: DashboardMode;
    hasActiveGame: boolean;
}

export interface DashboardFriendOnlineDto {
    userId: string;
    login: string;
    displayName: string | null;
}

export interface DashboardDto {
    lastMode: DashboardMode | null;
    canResume: boolean;
    resumePayload: DashboardResumePayloadDto | null;
    onlineFriends: DashboardFriendOnlineDto[];
    onlineFriendsCount: number;
    friendsCount: number;
    recentReplays: ReplayListItemDto[];
}

export async function getDashboard(token: string): Promise<DashboardDto> {
    const res = await fetch(`${getApiOrigin()}/api/game/dashboard`, { headers: headers(token) });
    const data = await parseJson<Partial<DashboardDto> & { error?: string }>(res);
    if (!res.ok) {
        throw new Error(data.error || 'Не удалось загрузить дашборд');
    }
    return {
        lastMode: data.lastMode ?? null,
        canResume: Boolean(data.canResume),
        resumePayload: data.resumePayload ?? null,
        onlineFriends: data.onlineFriends ?? [],
        onlineFriendsCount: Number(data.onlineFriendsCount ?? 0),
        friendsCount: Number(data.friendsCount ?? 0),
        recentReplays: data.recentReplays ?? []
    };
}

export async function getFriends(token: string): Promise<FriendsListDto> {
    const res = await fetch(`${getApiOrigin()}/api/game/friends`, { headers: headers(token) });
    const data = await parseJson<Partial<FriendsListDto> & { error?: string }>(res);
    if (!res.ok) throw new Error(data.error || 'Не удалось загрузить друзей');
    return {
        friends: data.friends ?? [],
        incoming: data.incoming ?? [],
        outgoing: data.outgoing ?? [],
        blocked: data.blocked ?? []
    };
}

async function friendAction(
    token: string,
    path: string,
    userId: string
): Promise<void> {
    const res = await fetch(`${getApiOrigin()}/api/game/friends/${path}`, {
        method: 'POST',
        headers: headers(token),
        body: JSON.stringify({ userId })
    });
    const data = await parseJson<{ error?: string }>(res);
    if (!res.ok) throw new Error(data.error || 'Ошибка');
}

export const sendFriendRequestApi = (t: string, id: string) => friendAction(t, 'request', id);
export const acceptFriendApi = (t: string, id: string) => friendAction(t, 'accept', id);
export const rejectFriendApi = (t: string, id: string) => friendAction(t, 'reject', id);
export const removeFriendApi = (t: string, id: string) => friendAction(t, 'remove', id);
export const blockUserApi = (t: string, id: string) => friendAction(t, 'block', id);
export const unblockUserApi = (t: string, id: string) => friendAction(t, 'unblock', id);

export interface UserSearchDto {
    userId: string;
    login: string;
    displayName: string | null;
    isOnline?: boolean;
}

export async function searchUsers(token: string, query: string): Promise<UserSearchDto[]> {
    const res = await fetch(
        `${getApiOrigin()}/api/game/users/search?q=${encodeURIComponent(query)}`,
        { headers: headers(token) }
    );
    const data = await parseJson<{ users?: UserSearchDto[]; error?: string }>(res);
    if (!res.ok) throw new Error(data.error || 'Ошибка поиска');
    return data.users ?? [];
}

// ====== REPLAY LIKES / PUBLIC GALLERY ======

export interface GalleryReplayDto {
    replayId: string;
    matchId: string;
    title: string;
    slug: string | null;
    ownerDisplayName: string | null;
    createdAt: string;
    endedAt: string | null;
    roomCode: string | null;
    winnerRole: string | null;
    matchStatus: string | null;
    durationTicks: number | null;
    likeCount: number;
    likedByMe: boolean;
}

export async function getPublicGallery(params: {
    limit?: number;
    offset?: number;
    sort?: 'new' | 'top';
} = {}): Promise<GalleryReplayDto[]> {
    const q = new URLSearchParams();
    if (params.limit) q.set('limit', String(params.limit));
    if (params.offset) q.set('offset', String(params.offset));
    if (params.sort) q.set('sort', params.sort);
    const res = await fetch(`${getApiOrigin()}/api/public/gallery?${q.toString()}`);
    const data = await parseJson<{ replays?: GalleryReplayDto[]; error?: string }>(res);
    if (!res.ok) throw new Error(data.error || 'Ошибка загрузки галереи');
    return data.replays ?? [];
}

/** Строка таблицы статистики (публичный эндпоинт галереи). */
export interface GalleryMatchStatRowDto {
    playerId: string;
    displayName?: string | null;
    role: string;
    kills: number;
    deaths: number;
    shotsFired: number;
    shotsHit: number;
    damageDealt: number;
    damageTaken: number;
    keyPickups: number;
    ammoPickups: number;
}

export async function getPublicGalleryReplayStats(replayId: string): Promise<{
    matchId: string;
    roomCode: string | null;
    matchStats: GalleryMatchStatRowDto[];
}> {
    const res = await fetch(
        `${getApiOrigin()}/api/public/gallery/replay/${encodeURIComponent(replayId)}/stats`
    );
    const data = await parseJson<{
        matchId?: string;
        roomCode?: string | null;
        matchStats?: GalleryMatchStatRowDto[];
        error?: string;
    }>(res);
    if (!res.ok) {
        throw new Error(data.error || 'Не удалось загрузить статистику');
    }
    return {
        matchId: String(data.matchId ?? ''),
        roomCode: data.roomCode ?? null,
        matchStats: Array.isArray(data.matchStats) ? data.matchStats : []
    };
}

export async function likeReplay(
    token: string,
    replayId: string
): Promise<{ likeCount: number; likedByMe: boolean }> {
    const res = await fetch(
        `${getApiOrigin()}/api/game/replays/${encodeURIComponent(replayId)}/like`,
        { method: 'POST', headers: headers(token) }
    );
    const data = await parseJson<{ likeCount?: number; likedByMe?: boolean; error?: string }>(res);
    if (!res.ok) throw new Error(data.error || 'Ошибка');
    return { likeCount: Number(data.likeCount ?? 0), likedByMe: Boolean(data.likedByMe) };
}

export async function unlikeReplay(
    token: string,
    replayId: string
): Promise<{ likeCount: number; likedByMe: boolean }> {
    const res = await fetch(
        `${getApiOrigin()}/api/game/replays/${encodeURIComponent(replayId)}/like`,
        { method: 'DELETE', headers: headers(token) }
    );
    const data = await parseJson<{ likeCount?: number; likedByMe?: boolean; error?: string }>(res);
    if (!res.ok) throw new Error(data.error || 'Ошибка');
    return { likeCount: Number(data.likeCount ?? 0), likedByMe: Boolean(data.likedByMe) };
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
