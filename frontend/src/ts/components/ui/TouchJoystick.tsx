import React, { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Аналоговый виртуальный джойстик. Используется слева под большой палец:
 * по y-оси — вперёд/назад (W/S), по x-оси — поворот корпуса (A/D).
 * Результат передаётся как чистый вектор { x, y } в диапазоне [-1, 1],
 * потребитель сам решает, какой порог считать нажатием клавиши.
 *
 * Захватываем указатель через setPointerCapture, чтобы палец не «терялся»
 * при уходе за пределы области джойстика.
 */
interface TouchJoystickProps {
    onVector: (v: { x: number; y: number }) => void;
    size?: number;
    className?: string;
}

const DEFAULT_SIZE = 150;

const TouchJoystick: React.FC<TouchJoystickProps> = ({ onVector, size = DEFAULT_SIZE, className }) => {
    const rootRef = useRef<HTMLDivElement>(null);
    const pointerIdRef = useRef<number | null>(null);
    const [knob, setKnob] = useState({ x: 0, y: 0 });
    const activeRef = useRef(false);

    const radius = size / 2;
    const knobRadius = size * 0.3;
    const maxTravel = radius - knobRadius * 0.5;

    const reset = useCallback(() => {
        activeRef.current = false;
        pointerIdRef.current = null;
        setKnob({ x: 0, y: 0 });
        onVector({ x: 0, y: 0 });
    }, [onVector]);

    const update = useCallback(
        (clientX: number, clientY: number) => {
            const el = rootRef.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            let dx = clientX - cx;
            let dy = clientY - cy;
            const dist = Math.hypot(dx, dy);
            if (dist > maxTravel) {
                const k = maxTravel / dist;
                dx *= k;
                dy *= k;
            }
            setKnob({ x: dx, y: dy });
            const vx = dx / maxTravel;
            const vy = dy / maxTravel;
            onVector({ x: vx, y: vy });
        },
        [maxTravel, onVector]
    );

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (pointerIdRef.current !== null) return;
        pointerIdRef.current = e.pointerId;
        activeRef.current = true;
        try {
            e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
            /* ignore */
        }
        update(e.clientX, e.clientY);
    };

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!activeRef.current || pointerIdRef.current !== e.pointerId) return;
        update(e.clientX, e.clientY);
    };

    const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (pointerIdRef.current !== e.pointerId) return;
        try {
            e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
            /* ignore */
        }
        reset();
    };

    // На всякий случай при unmount отпускаем ввод
    useEffect(() => reset, [reset]);

    return (
        <div
            ref={rootRef}
            className={className ? `touch-joystick ${className}` : 'touch-joystick'}
            style={{ width: size, height: size }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onLostPointerCapture={reset}
            role="presentation"
        >
            <div className="touch-joystick-ring" />
            <div
                className="touch-joystick-knob"
                style={{
                    width: knobRadius * 2,
                    height: knobRadius * 2,
                    left: `calc(50% - ${knobRadius}px)`,
                    top: `calc(50% - ${knobRadius}px)`,
                    transform: `translate(${knob.x}px, ${knob.y}px)`
                }}
            />
        </div>
    );
};

export default TouchJoystick;
