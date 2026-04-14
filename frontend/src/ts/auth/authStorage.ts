const TOKEN_KEY = '2dtanks_access_token';

export function getStoredAccessToken(): string | null {
    try {
        return localStorage.getItem(TOKEN_KEY);
    } catch {
        return null;
    }
}

export function setStoredAccessToken(token: string | null): void {
    try {
        if (token) {
            localStorage.setItem(TOKEN_KEY, token);
        } else {
            localStorage.removeItem(TOKEN_KEY);
        }
    } catch {
        /* ignore */
    }
}
