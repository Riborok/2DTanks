import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    createTankPreset,
    deleteTankPreset,
    listTankPresets,
    updateTankPreset,
    type TankPresetDto,
    type TankPresetInputDto
} from '../../auth/gameApi';
import { useAuth } from '../../context/AuthContext';

const PRESET_NAME_MAX_LEN = 40;
const MAX_PRESETS = 10;

interface CurrentConfig {
    color: number;
    hullNum: number;
    trackNum: number;
    turretNum: number;
    weaponNum: number;
}

interface TankPresetBarProps {
    current: CurrentConfig;
    onApply: (cfg: CurrentConfig) => void;
    /** Цвета, недоступные для выбора в лобби (чужие). Применяемый пресет не переопределит цвет, если он занят. */
    occupiedColors?: number[];
    /** Колбэк, сообщающий наверх актуальное количество сохранённых сетов. */
    onCountChange?: (count: number) => void;
}

function presetToConfig(p: TankPresetDto): CurrentConfig {
    return {
        color: p.color,
        hullNum: p.hullNum,
        trackNum: p.trackNum,
        turretNum: p.turretNum,
        weaponNum: p.weaponNum
    };
}

const TankPresetBar: React.FC<TankPresetBarProps> = ({ current, onApply, occupiedColors, onCountChange }) => {
    const { accessToken } = useAuth();
    const [presets, setPresets] = useState<TankPresetDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [error, setError] = useState<string>('');
    const [name, setName] = useState('');
    const [saveMode, setSaveMode] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{ type: 'overwrite' | 'delete'; preset: TankPresetDto } | null>(null);

    const occupiedSet = useMemo(() => new Set(occupiedColors ?? []), [occupiedColors]);

    useEffect(() => {
        onCountChange?.(presets.length);
    }, [presets.length, onCountChange]);

    useEffect(() => {
        if (!accessToken) {
            setLoading(false);
            setPresets([]);
            setError('');
            return;
        }
        let cancelled = false;
        setLoading(true);
        listTankPresets(accessToken)
            .then(({ presets: list }) => {
                if (!cancelled) {
                    setPresets(list);
                }
            })
            .catch((e: unknown) => {
                if (!cancelled) {
                    setError(e instanceof Error ? e.message : 'Ошибка загрузки');
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });
        return () => {
            cancelled = true;
        };
    }, [accessToken]);

    const handleApply = useCallback(
        (preset: TankPresetDto) => {
            const cfg = presetToConfig(preset);
            if (occupiedSet.has(cfg.color)) {
                cfg.color = current.color;
            }
            onApply(cfg);
        },
        [onApply, occupiedSet, current.color]
    );

    const handleSave = useCallback(async () => {
        if (!accessToken) {
            return;
        }
        const trimmed = name.trim();
        if (!trimmed) {
            setError('Введите название сета');
            return;
        }
        if (trimmed.length > PRESET_NAME_MAX_LEN) {
            setError(`До ${PRESET_NAME_MAX_LEN} символов`);
            return;
        }
        if (presets.length >= MAX_PRESETS) {
            setError(`Достигнут лимит (${MAX_PRESETS})`);
            return;
        }
        setError('');
        setBusyId('__new__');
        try {
            const payload: TankPresetInputDto = { name: trimmed, ...current };
            const { preset } = await createTankPreset(accessToken, payload);
            setPresets((prev) => [preset, ...prev]);
            setName('');
            setSaveMode(false);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Ошибка сохранения');
        } finally {
            setBusyId(null);
        }
    }, [accessToken, name, presets.length, current]);

    const handleOverwrite = useCallback((preset: TankPresetDto) => {
        setConfirmAction({ type: 'overwrite', preset });
    }, []);

    const handleDelete = useCallback((preset: TankPresetDto) => {
        setConfirmAction({ type: 'delete', preset });
    }, []);

    const executeOverwrite = useCallback(async () => {
        if (!accessToken || !confirmAction || confirmAction.type !== 'overwrite') return;
        const { preset } = confirmAction;
        setBusyId(preset.presetId);
        setError('');
        setConfirmAction(null);
        try {
            const payload: TankPresetInputDto = { name: preset.name, ...current };
            const { preset: updated } = await updateTankPreset(accessToken, preset.presetId, payload);
            setPresets((prev) => prev.map((p) => (p.presetId === updated.presetId ? updated : p)));
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Ошибка обновления');
        } finally {
            setBusyId(null);
        }
    }, [accessToken, current, confirmAction]);

    const executeDelete = useCallback(async () => {
        if (!accessToken || !confirmAction || confirmAction.type !== 'delete') return;
        const { preset } = confirmAction;
        setBusyId(preset.presetId);
        setError('');
        setConfirmAction(null);
        try {
            await deleteTankPreset(accessToken, preset.presetId);
            setPresets((prev) => prev.filter((p) => p.presetId !== preset.presetId));
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Ошибка удаления');
        } finally {
            setBusyId(null);
        }
    }, [accessToken, confirmAction]);

    if (!accessToken) {
        return null;
    }

    return (
        <div className="tank-presets">
            <div className="tank-presets__head">
                <div className="tank-presets__title-wrap">
                    <h3 className="tank-presets__title">Мои сеты</h3>
                    <span className="tank-presets__counter">
                        {presets.length} / {MAX_PRESETS}
                    </span>
                </div>
                {!saveMode ? (
                    <button
                        type="button"
                        className="ui-btn ui-btn-secondary tank-presets__save-btn"
                        onClick={() => {
                            setSaveMode(true);
                            setError('');
                        }}
                        disabled={presets.length >= MAX_PRESETS}
                        title={
                            presets.length >= MAX_PRESETS
                                ? `Достигнут лимит (${MAX_PRESETS})`
                                : 'Сохранить текущую сборку как сет'
                        }
                    >
                        + Сохранить текущий
                    </button>
                ) : (
                    <div className="tank-presets__save-form">
                        <input
                            type="text"
                            className="tank-presets__name-input"
                            placeholder="Название сета"
                            autoFocus
                            value={name}
                            maxLength={PRESET_NAME_MAX_LEN}
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    void handleSave();
                                } else if (e.key === 'Escape') {
                                    setSaveMode(false);
                                    setName('');
                                    setError('');
                                }
                            }}
                            disabled={busyId === '__new__'}
                        />
                        <button
                            type="button"
                            className="ui-btn ui-btn-primary tank-presets__save-confirm"
                            onClick={() => void handleSave()}
                            disabled={busyId === '__new__' || !name.trim()}
                        >
                            ОК
                        </button>
                        <button
                            type="button"
                            className="ui-btn ui-btn-secondary tank-presets__save-cancel"
                            onClick={() => {
                                setSaveMode(false);
                                setName('');
                                setError('');
                            }}
                            disabled={busyId === '__new__'}
                        >
                            Отмена
                        </button>
                    </div>
                )}
            </div>

            {error && <div className="tank-presets__error">{error}</div>}

            {loading ? (
                <div className="tank-presets__empty">Загрузка…</div>
            ) : presets.length === 0 ? (
                <div className="tank-presets__empty">
                    Нет сохранённых сетов. Соберите танк и нажмите «Сохранить текущий».
                </div>
            ) : (
                <ul className="tank-presets__list">
                    {presets.map((p) => {
                        const isBusy = busyId === p.presetId;
                        const colorLocked = occupiedSet.has(p.color);
                        return (
                            <li
                                key={p.presetId}
                                className={`tank-presets__item${isBusy ? ' is-busy' : ''}`}
                            >
                                <button
                                    type="button"
                                    className="tank-presets__apply"
                                    onClick={() => handleApply(p)}
                                    disabled={isBusy}
                                    title={
                                        colorLocked
                                            ? 'Цвет сета занят — будет использован текущий'
                                            : 'Применить сет'
                                    }
                                >
                                    <span className="tank-presets__name">{p.name}</span>
                                    <span className="tank-presets__specs">
                                        K{p.hullNum}·Г{p.trackNum}·Б{p.turretNum}·О{p.weaponNum}
                                        <span
                                            className="tank-presets__color-dot"
                                            data-color={p.color}
                                            aria-hidden="true"
                                        />
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    className="tank-presets__action tank-presets__action--update"
                                    onClick={() => void handleOverwrite(p)}
                                    disabled={isBusy}
                                    title="Перезаписать текущей сборкой"
                                >
                                    ⟳
                                </button>
                                <button
                                    type="button"
                                    className="tank-presets__action tank-presets__action--delete"
                                    onClick={() => void handleDelete(p)}
                                    disabled={isBusy}
                                    title="Удалить сет"
                                >
                                    ✕
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}

            {confirmAction && (
                <div className="tank-presets__modal-overlay" onClick={() => setConfirmAction(null)}>
                    <div className="tank-presets__modal" onClick={(e) => e.stopPropagation()}>
                        <div className="tank-presets__modal-icon">
                            {confirmAction.type === 'delete' ? '🗑️' : '⟳'}
                        </div>
                        <h4 className="tank-presets__modal-title">
                            {confirmAction.type === 'delete' ? 'Удалить сет?' : 'Перезаписать сет?'}
                        </h4>
                        <p className="tank-presets__modal-text">
                            {confirmAction.type === 'delete'
                                ? `Вы уверены, что хотите безвозвратно удалить «${confirmAction.preset.name}»?`
                                : `Заменить «${confirmAction.preset.name}» на текущую сборку?`}
                        </p>
                        <div className="tank-presets__modal-actions">
                            <button
                                type="button"
                                className="ui-btn ui-btn-secondary tank-presets__modal-btn"
                                onClick={() => setConfirmAction(null)}
                            >
                                Отмена
                            </button>
                            <button
                                type="button"
                                className={`ui-btn tank-presets__modal-btn ${
                                    confirmAction.type === 'delete' ? 'tank-presets__modal-btn--danger' : 'ui-btn-primary'
                                }`}
                                onClick={confirmAction.type === 'delete' ? executeDelete : executeOverwrite}
                            >
                                {confirmAction.type === 'delete' ? 'Удалить' : 'Перезаписать'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TankPresetBar;
