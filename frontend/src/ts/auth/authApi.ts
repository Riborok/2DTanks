import { getApiOrigin } from './apiOrigin';

export interface AuthUserDto {
    userId: string;
    login: string;
    email: string;
    displayName: string;
    createdAt: string;
}

export interface AuthProfileDto {
    avatarUrl: string | null;
    preferredRole: 'attacker' | 'defender' | null;
}

async function parseJson<T>(res: Response): Promise<T & { error?: string }> {
    const data = (await res.json()) as T & { error?: string };
    return data;
}

export async function registerAccount(params: {
    login: string;
    email: string;
    password: string;
    displayName: string;
}): Promise<{ token: string; user: AuthUserDto; profile: AuthProfileDto | null }> {
    const res = await fetch(`${getApiOrigin()}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
    });
    const data = await parseJson<{
        token?: string;
        user?: AuthUserDto;
        profile?: AuthProfileDto | null;
        error?: string;
    }>(res);
    if (!res.ok) {
        throw new Error(data.error || 'Ошибка регистрации');
    }
    if (!data.token || !data.user) {
        throw new Error('Некорректный ответ сервера');
    }
    return { token: data.token, user: data.user, profile: data.profile ?? null };
}

export async function loginAccount(params: {
    login: string;
    password: string;
}): Promise<{ token: string; user: AuthUserDto; profile: AuthProfileDto | null }> {
    const res = await fetch(`${getApiOrigin()}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
    });
    const data = await parseJson<{
        token?: string;
        user?: AuthUserDto;
        profile?: AuthProfileDto | null;
        error?: string;
    }>(res);
    if (!res.ok) {
        throw new Error(data.error || 'Ошибка входа');
    }
    if (!data.token || !data.user) {
        throw new Error('Некорректный ответ сервера');
    }
    return { token: data.token, user: data.user, profile: data.profile ?? null };
}

export async function updateProfile(
    token: string,
    body: { avatarUrl?: string | null; preferredRole?: 'attacker' | 'defender' | null }
): Promise<{ profile: AuthProfileDto | null }> {
    const res = await fetch(`${getApiOrigin()}/api/auth/profile`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });
    const data = await parseJson<{ profile?: AuthProfileDto | null; error?: string }>(res);
    if (!res.ok) {
        throw new Error(data.error || 'Ошибка сохранения профиля');
    }
    return { profile: data.profile ?? null };
}

export async function fetchMe(token: string): Promise<{ user: AuthUserDto; profile: AuthProfileDto | null }> {
    const res = await fetch(`${getApiOrigin()}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    const data = await parseJson<{ user?: AuthUserDto; profile?: AuthProfileDto | null; error?: string }>(res);
    if (!res.ok) {
        throw new Error(data.error || 'Сессия недействительна');
    }
    if (!data.user) {
        throw new Error('Некорректный ответ сервера');
    }
    return { user: data.user, profile: data.profile ?? null };
}
