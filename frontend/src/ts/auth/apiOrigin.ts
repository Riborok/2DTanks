/** Задаётся webpack DefinePlugin: пустая строка = тот же origin (Docker + nginx). */
declare const __GAME_API_ORIGIN__: string | undefined;

export function getApiOrigin(): string {
    const raw =
        typeof __GAME_API_ORIGIN__ !== 'undefined' ? String(__GAME_API_ORIGIN__) : 'http://localhost:3000';
    if (raw === '' && typeof window !== 'undefined') {
        return window.location.origin;
    }
    return raw || 'http://localhost:3000';
}
