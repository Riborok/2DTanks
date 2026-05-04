import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useLayoutEffect,
    useMemo,
    useState
} from 'react';
import { DEFAULT_KEY_BINDINGS, type KeyBindings } from '../utils/keyBindings';

/**
 * Все пользовательские настройки игры. Лежат в localStorage по ключу SETTINGS_KEY,
 * применяются в компонентах через useSettings(). Значения, которые важны для рендера,
 * подписчики читают напрямую при каждом render; «звуковые» значения подхватываются
 * менеджером звука при проигрывании.
 */
export type UiTheme = 'dark' | 'light';

export interface GameSettings {
    appearance: {
        theme: UiTheme;
    };
    audio: {
        master: number;
        music: number;
        sfx: number;
        ui: number;
    };
    mobile: {
        touchSide: 'left' | 'right';
        touchScale: number;
        holdToFire: boolean;
        haptics: boolean;
    };
    controls: {
        keyBindings: KeyBindings;
    };
}

const DEFAULT_SETTINGS: GameSettings = {
    appearance: {
        theme: 'dark'
    },
    audio: {
        master: 0.8,
        music: 0.4,
        sfx: 0.8,
        ui: 0.6
    },
    mobile: {
        touchSide: 'left',
        touchScale: 1,
        holdToFire: true,
        haptics: true
    },
    controls: {
        keyBindings: { ...DEFAULT_KEY_BINDINGS }
    }
};

const SETTINGS_KEY = 'tanks.settings.v1';

function loadSettings(): GameSettings {
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (!raw) return DEFAULT_SETTINGS;
        const parsed = JSON.parse(raw);
        return mergeWithDefaults(parsed);
    } catch {
        return DEFAULT_SETTINGS;
    }
}

function normalizeTheme(t: unknown): UiTheme {
    return t === 'light' ? 'light' : 'dark';
}

function mergeWithDefaults(v: any): GameSettings {
    const s = v && typeof v === 'object' ? v : {};
    const rawControls = s.controls && typeof s.controls === 'object' ? s.controls : {};
    const kb = rawControls.keyBindings && typeof rawControls.keyBindings === 'object' ? rawControls.keyBindings : {};
    const rawAppearance = s.appearance && typeof s.appearance === 'object' ? s.appearance : {};
    return {
        appearance: {
            theme: normalizeTheme(rawAppearance.theme)
        },
        audio: { ...DEFAULT_SETTINGS.audio, ...(s.audio || {}) },
        mobile: { ...DEFAULT_SETTINGS.mobile, ...(s.mobile || {}) },
        controls: {
            keyBindings: { ...DEFAULT_KEY_BINDINGS, ...kb }
        }
    };
}

function saveSettings(v: GameSettings) {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(v));
    } catch {
        /* ignore — приватный режим или полная квота */
    }
}

interface SettingsContextValue {
    settings: GameSettings;
    update: <K extends keyof GameSettings>(section: K, patch: Partial<GameSettings[K]>) => void;
    reset: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

function applyThemeToDocument(theme: UiTheme) {
    document.documentElement.setAttribute('data-theme', theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
        meta.setAttribute('content', theme === 'light' ? '#e8e2d8' : '#0c0a08');
    }
}

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<GameSettings>(() => loadSettings());

    useLayoutEffect(() => {
        applyThemeToDocument(settings.appearance.theme);
    }, [settings.appearance.theme]);

    useEffect(() => {
        saveSettings(settings);
    }, [settings]);

    const update = useCallback(
        <K extends keyof GameSettings>(section: K, patch: Partial<GameSettings[K]>) => {
            setSettings((prev) => ({
                ...prev,
                [section]: { ...prev[section], ...patch }
            }));
        },
        []
    );

    const reset = useCallback(() => setSettings(DEFAULT_SETTINGS), []);

    const value = useMemo<SettingsContextValue>(() => ({ settings, update, reset }), [settings, update, reset]);

    return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export function useSettings(): SettingsContextValue {
    const ctx = useContext(SettingsContext);
    if (!ctx) {
        throw new Error('useSettings must be used inside <SettingsProvider>');
    }
    return ctx;
}

/**
 * Ref-образный «живой» снимок настроек — удобно читать из обработчиков/игрового
 * цикла, которые не пересоздаются при каждом ререндере.
 */
export function useSettingsRef() {
    const { settings } = useSettings();
    const ref = React.useRef(settings);
    ref.current = settings;
    return ref;
}

export { DEFAULT_SETTINGS };
