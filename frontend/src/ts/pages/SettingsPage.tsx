import React, { useCallback, useEffect, useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import {
    CONTROL_ACTION_LABELS,
    CONTROL_ACTION_ORDER,
    DEFAULT_KEY_BINDINGS,
    RESERVED_GAME_KEY_CODES,
    type ControlAction,
    formatKeyCode
} from '../utils/keyBindings';

const TOUCH_GAME_MEDIA = '(max-width: 900px), (pointer: coarse)';

const SettingsPage: React.FC = () => {
    const { settings, update, reset } = useSettings();
    const [touchGameUi, setTouchGameUi] = useState(false);
    const [capturing, setCapturing] = useState<ControlAction | null>(null);

    useEffect(() => {
        const mq = window.matchMedia(TOUCH_GAME_MEDIA);
        const apply = () => setTouchGameUi(mq.matches);
        apply();
        mq.addEventListener('change', apply);
        return () => mq.removeEventListener('change', apply);
    }, []);

    useEffect(() => {
        if (!capturing) return;
        const onKey = (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.code === 'Escape') {
                setCapturing(null);
                return;
            }
            if (e.repeat) return;
            if (RESERVED_GAME_KEY_CODES.has(e.code)) {
                return;
            }
            const cur = settings.controls.keyBindings;
            const takenBy = CONTROL_ACTION_ORDER.find((a) => a !== capturing && cur[a] === e.code);
            if (takenBy) {
                return;
            }
            update('controls', {
                keyBindings: { ...cur, [capturing]: e.code }
            });
            setCapturing(null);
        };
        window.addEventListener('keydown', onKey, true);
        return () => window.removeEventListener('keydown', onKey, true);
    }, [capturing, settings.controls.keyBindings, update]);

    const resetKeys = useCallback(() => {
        update('controls', { keyBindings: { ...DEFAULT_KEY_BINDINGS } });
    }, [update]);

    return (
        <div className="page-settings">
            <div className="settings-screen">
                <div className="settings-panel">
                    <header className="settings-header">
                        <h1 className="settings-page-title">Настройки</h1>
                        <p className="settings-lead">
                            Параметры интерфейса и управления сохраняются в этом браузере на вашем устройстве.
                        </p>
                    </header>

                    <section className="settings-section" aria-labelledby="settings-appearance-heading">
                        <h2 id="settings-appearance-heading">Внешний вид</h2>
                        <p className="settings-lede">Цветовая схема интерфейса сохраняется на этом устройстве.</p>
                        <div className="settings-row">
                            <label>Тема</label>
                            <div className="settings-seg settings-seg--theme">
                                <button
                                    type="button"
                                    className={settings.appearance.theme === 'dark' ? 'active' : ''}
                                    onClick={() => update('appearance', { theme: 'dark' })}
                                >
                                    Тёмная
                                </button>
                                <button
                                    type="button"
                                    className={settings.appearance.theme === 'light' ? 'active' : ''}
                                    onClick={() => update('appearance', { theme: 'light' })}
                                >
                                    Светлая
                                </button>
                            </div>
                        </div>
                    </section>

                    {!touchGameUi && (
                        <section className="settings-section" aria-labelledby="settings-keys-heading">
                            <h2 id="settings-keys-heading">Клавиатура (ПК)</h2>
                            <p className="settings-lede">
                                В бою клавиша <kbd>V</kbd> зарезервирована под колесо пингов. Нажмите поле и нажмите
                                новую клавишу; <kbd>Esc</kbd> — отмена записи.
                            </p>
                            <div className="settings-key-grid">
                                {CONTROL_ACTION_ORDER.map((action) => (
                                    <div key={action} className="settings-key-row">
                                        <span className="settings-key-label">{CONTROL_ACTION_LABELS[action]}</span>
                                        <button
                                            type="button"
                                            className={
                                                capturing === action
                                                    ? 'settings-key-cap settings-key-cap--active'
                                                    : 'settings-key-cap'
                                            }
                                            onClick={() => setCapturing((c) => (c === action ? null : action))}
                                        >
                                            {capturing === action
                                                ? '… нажмите клавишу'
                                                : formatKeyCode(settings.controls.keyBindings[action])}
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button type="button" className="ui-btn ui-btn-secondary settings-action-btn" onClick={resetKeys}>
                                Сбросить клавиши по умолчанию
                            </button>
                        </section>
                    )}

                    {touchGameUi && (
                        <section className="settings-section" aria-labelledby="settings-touch-heading">
                            <h2 id="settings-touch-heading">Мобильное управление</h2>
                            <p className="settings-lede">
                                Только для сенсорного режима игры (как на телефоне). Подсказка повернуть устройство в бою
                                в этом режиме всегда включена.
                            </p>
                            <div className="settings-row">
                                <label>Сторона джойстика</label>
                                <div className="settings-seg">
                                    <button
                                        type="button"
                                        className={settings.mobile.touchSide === 'left' ? 'active' : ''}
                                        onClick={() => update('mobile', { touchSide: 'left' })}
                                    >
                                        Слева (правша)
                                    </button>
                                    <button
                                        type="button"
                                        className={settings.mobile.touchSide === 'right' ? 'active' : ''}
                                        onClick={() => update('mobile', { touchSide: 'right' })}
                                    >
                                        Справа (левша)
                                    </button>
                                </div>
                            </div>
                            <Slider
                                label={`Размер кнопок: ${settings.mobile.touchScale.toFixed(2)}×`}
                                value={(settings.mobile.touchScale - 0.7) / 0.6}
                                onChange={(e) => update('mobile', { touchScale: 0.7 + (Number(e.target.value) / 100) * 0.6 })}
                            />
                            <Checkbox
                                label="Удержание кнопки стреляет очередью"
                                checked={settings.mobile.holdToFire}
                                onChange={(v) => update('mobile', { holdToFire: v })}
                            />
                            <Checkbox
                                label="Вибрация при выстреле и попадании"
                                checked={settings.mobile.haptics}
                                onChange={(v) => update('mobile', { haptics: v })}
                            />
                        </section>
                    )}

                    <button type="button" className="ui-btn ui-btn-secondary settings-reset-btn" onClick={reset}>
                        Сбросить к стандартным
                    </button>
                </div>
            </div>
        </div>
    );
};

const Slider: React.FC<{
    label: string;
    value: number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ label, value, onChange }) => (
    <div className="settings-row">
        <label>{label}</label>
        <input type="range" min={0} max={100} value={Math.round(value * 100)} onChange={onChange} />
    </div>
);

const Checkbox: React.FC<{
    label: string;
    checked: boolean;
    onChange: (v: boolean) => void;
}> = ({ label, checked, onChange }) => (
    <label className="settings-checkbox">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span>{label}</span>
    </label>
);

export default SettingsPage;
