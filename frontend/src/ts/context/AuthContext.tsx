import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState
} from 'react';
import { fetchMe, loginAccount, registerAccount } from '../auth/authApi';
import { getStoredAccessToken, setStoredAccessToken } from '../auth/authStorage';

export type AuthUser = {
    userId: string;
    displayName: string;
    login: string;
    preferredRole?: 'attacker' | 'defender' | null;
    avatarUrl?: string | null;
};

type AuthContextValue = {
    authUser: AuthUser | null;
    accessToken: string | null;
    tokenRef: React.MutableRefObject<string | null>;
    authRestored: boolean;
    authBusy: boolean;
    login: (login: string, password: string) => Promise<void>;
    register: (login: string, email: string, password: string, displayName: string) => Promise<void>;
    logout: () => void;
    setAuthUserPreferredRole: (role: 'attacker' | 'defender' | null) => void;
    setAuthUserAvatarUrl: (avatarUrl: string | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const tokenRef = useRef<string | null>(getStoredAccessToken());
    const [authUser, setAuthUser] = useState<AuthUser | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(getStoredAccessToken());
    const [authRestored, setAuthRestored] = useState(false);
    const [authBusy, setAuthBusy] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const t = tokenRef.current;
        if (!t) {
            setAccessToken(null);
            setAuthRestored(true);
            return () => {
                cancelled = true;
            };
        }
        fetchMe(t)
            .then(({ user, profile }) => {
                if (!cancelled) {
                    setAuthUser({
                        userId: user.userId,
                        displayName: user.displayName,
                        login: user.login,
                        preferredRole: profile?.preferredRole ?? null,
                        avatarUrl: profile?.avatarUrl ?? null
                    });
                    setAccessToken(t);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    tokenRef.current = null;
                    setStoredAccessToken(null);
                    setAuthUser(null);
                    setAccessToken(null);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setAuthRestored(true);
                }
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const login = useCallback(async (loginStr: string, password: string) => {
        setAuthBusy(true);
        try {
            const { token, user, profile } = await loginAccount({ login: loginStr, password });
            tokenRef.current = token;
            setStoredAccessToken(token);
            setAccessToken(token);
            setAuthUser({
                userId: user.userId,
                displayName: user.displayName,
                login: user.login,
                preferredRole: profile?.preferredRole ?? null,
                avatarUrl: profile?.avatarUrl ?? null
            });
        } finally {
            setAuthBusy(false);
        }
    }, []);

    const register = useCallback(
        async (loginStr: string, email: string, password: string, displayName: string) => {
            setAuthBusy(true);
            try {
                const { token, user, profile } = await registerAccount({
                    login: loginStr,
                    email,
                    password,
                    displayName
                });
                tokenRef.current = token;
                setStoredAccessToken(token);
                setAccessToken(token);
                setAuthUser({
                    userId: user.userId,
                    displayName: user.displayName,
                    login: user.login,
                    preferredRole: profile?.preferredRole ?? null,
                    avatarUrl: profile?.avatarUrl ?? null
                });
            } finally {
                setAuthBusy(false);
            }
        },
        []
    );

    const logout = useCallback(() => {
        tokenRef.current = null;
        setStoredAccessToken(null);
        setAccessToken(null);
        setAuthUser(null);
    }, []);

    const setAuthUserPreferredRole = useCallback((role: 'attacker' | 'defender' | null) => {
        setAuthUser((prev) => (prev ? { ...prev, preferredRole: role } : null));
    }, []);

    const setAuthUserAvatarUrl = useCallback((avatarUrl: string | null) => {
        setAuthUser((prev) => (prev ? { ...prev, avatarUrl } : null));
    }, []);

    const value = useMemo(
        () => ({
            authUser,
            accessToken,
            tokenRef,
            authRestored,
            authBusy,
            login,
            register,
            logout,
            setAuthUserPreferredRole,
            setAuthUserAvatarUrl
        }),
        [
            authUser,
            accessToken,
            authRestored,
            authBusy,
            login,
            register,
            logout,
            setAuthUserPreferredRole,
            setAuthUserAvatarUrl
        ]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return ctx;
}
