import React, { useCallback, useEffect, useState } from 'react';

export type FullscreenToggleVariant = 'toolbar' | 'corner';

export interface FullscreenToggleProps {
    /** toolbar — в панели HUD рядом с «Выйти»; corner — фиксированная кнопка в углу */
    variant?: FullscreenToggleVariant;
}

/**
 * Полный экран и выход из него.
 * В fullscreen шапка скрыта по умолчанию; стрелка ▼ открывает меню (атрибут на html + CSS в AppShell.css).
 */
const FullscreenToggle: React.FC<FullscreenToggleProps> = ({ variant = 'toolbar' }) => {
    const [isFull, setIsFull] = useState<boolean>(() => Boolean(document.fullscreenElement));
    const [headerPeekOpen, setHeaderPeekOpen] = useState(false);
    const canFullscreen = Boolean(document.fullscreenEnabled);

    useEffect(() => {
        const onChange = () => {
            const full = Boolean(document.fullscreenElement);
            setIsFull(full);
            setHeaderPeekOpen(false);
            document.documentElement.removeAttribute('data-fullscreen-header-open');
        };
        document.addEventListener('fullscreenchange', onChange);
        document.addEventListener('webkitfullscreenchange', onChange);
        return () => {
            document.removeEventListener('fullscreenchange', onChange);
            document.removeEventListener('webkitfullscreenchange', onChange);
        };
    }, []);

    useEffect(() => {
        if (!isFull) {
            document.documentElement.removeAttribute('data-fullscreen-header-open');
            return;
        }
        if (headerPeekOpen) {
            document.documentElement.setAttribute('data-fullscreen-header-open', 'true');
        } else {
            document.documentElement.removeAttribute('data-fullscreen-header-open');
        }
    }, [isFull, headerPeekOpen]);

    useEffect(
        () => () => {
            document.documentElement.removeAttribute('data-fullscreen-header-open');
        },
        []
    );

    const toggle = useCallback(async () => {
        try {
            if (!document.fullscreenElement) {
                setHeaderPeekOpen(false);
                document.documentElement.removeAttribute('data-fullscreen-header-open');
                await document.documentElement.requestFullscreen();
                try {
                    const o = (screen as any).orientation;
                    await o?.lock?.('landscape');
                } catch {
                    /* iOS Safari */
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
            /* отмена пользователем */
        }
    }, []);

    const toggleHeaderPeek = useCallback(() => {
        setHeaderPeekOpen((v) => !v);
    }, []);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.code !== 'KeyF') return;
            const tag = (e.target as HTMLElement)?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
            e.preventDefault();
            void toggle();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [toggle]);

    if (!canFullscreen) return null;

    const toolbarFsBtn = (
        <button
            type="button"
            className="fullscreen-toggle fullscreen-toggle--toolbar"
            onClick={toggle}
            title={isFull ? 'Выйти из полного экрана (F)' : 'Полный экран (F)'}
            aria-label={isFull ? 'Выйти из полного экрана' : 'Полный экран'}
            aria-pressed={isFull}
        >
            {isFull ? '⤡' : '⤢'}
        </button>
    );

    if (variant === 'corner') {
        return (
            <button
                type="button"
                className="fullscreen-toggle fullscreen-toggle--corner"
                onClick={toggle}
                title={isFull ? 'Выйти из полного экрана (F)' : 'Полный экран (F)'}
                aria-label={isFull ? 'Выйти из полного экрана' : 'Полный экран'}
                aria-pressed={isFull}
            >
                {isFull ? '⤡' : '⤢'}
            </button>
        );
    }

    return (
        <div className="fullscreen-toolbar">
            {toolbarFsBtn}
            {isFull && (
                <button
                    type="button"
                    className="fullscreen-site-menu-btn"
                    onClick={toggleHeaderPeek}
                    aria-expanded={headerPeekOpen}
                    aria-label={headerPeekOpen ? 'Скрыть меню сайта' : 'Показать меню сайта'}
                    title={headerPeekOpen ? 'Скрыть меню' : 'Показать меню навигации'}
                >
                    <span className="fullscreen-site-menu-btn__chevron" aria-hidden="true">
                        {headerPeekOpen ? '▲' : '▼'}
                    </span>
                    <span className="fullscreen-site-menu-btn__label">Меню</span>
                </button>
            )}
        </div>
    );
};

export default FullscreenToggle;
