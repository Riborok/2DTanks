import React, { useCallback, useEffect, useState } from 'react';

/**
 * Кнопка «во весь экран» + блокировка landscape на мобилке.
 * Показывается только на устройствах с pointer: coarse (см. CSS).
 * Если orientation.lock не поддержан (большинство iOS Safari) — не фейлим,
 * уже показанная HUD-подсказка «поверните телефон» остаётся рабочей.
 */
const FullscreenToggle: React.FC = () => {
    const [isFull, setIsFull] = useState<boolean>(Boolean(document.fullscreenElement));

    useEffect(() => {
        const onChange = () => setIsFull(Boolean(document.fullscreenElement));
        document.addEventListener('fullscreenchange', onChange);
        return () => document.removeEventListener('fullscreenchange', onChange);
    }, []);

    const toggle = useCallback(async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
                try {
                    const o = (screen as any).orientation;
                    await o?.lock?.('landscape');
                } catch {
                    /* iOS Safari: тихо игнорируем */
                }
            } else {
                try {
                    const o = (screen as any).orientation;
                    o?.unlock?.();
                } catch {
                    /* ignore */
                }
                await document.exitFullscreen();
            }
        } catch {
            /* пользователь мог отклонить — ничего страшного */
        }
    }, []);

    return (
        <button type="button" className="fullscreen-toggle" onClick={toggle} aria-label="Полный экран">
            {isFull ? '⤢' : '⛶'}
        </button>
    );
};

export default FullscreenToggle;
