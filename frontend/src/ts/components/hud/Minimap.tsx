import React, { useEffect, useRef } from 'react';
import { GameWorldSnapshot } from '../../online/types';
import { ResolutionManager } from '../../constants/gameConstants';

/**
 * Мини-карта: собственный canvas, на котором мы раз за кадр отрисовываем
 * упрощённую проекцию мира — стены одним цветом, свой/чужие танки
 * точками, ключи и бонусы отдельными цветами.
 */
interface MinimapProps {
    snapshotRef: React.MutableRefObject<GameWorldSnapshot | null>;
    myPlayerId: string;
    size?: number;
}

const Minimap: React.FC<MinimapProps> = ({ snapshotRef, myPlayerId, size = 180 }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        let raf = 0;
        const draw = () => {
            const canvas = canvasRef.current;
            const snap = snapshotRef.current;
            if (canvas && snap) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = 'rgba(10, 14, 24, 0.7)';
                    ctx.fillRect(0, 0, w, h);

                    const sx = w / ResolutionManager.BASE_GAME_WIDTH;
                    const sy = h / ResolutionManager.BASE_GAME_HEIGHT;

                    // Стены (упрощённо — маленькие серые точки)
                    ctx.fillStyle = 'rgba(150, 150, 170, 0.55)';
                    for (const wall of snap.walls) {
                        ctx.fillRect(wall.x * sx - 1, wall.y * sy - 1, 2, 2);
                    }

                    // Ящики
                    if (snap.crates) {
                        ctx.fillStyle = 'rgba(200, 170, 90, 0.7)';
                        for (const c of snap.crates) {
                            ctx.fillRect(c.x * sx - 1, c.y * sy - 1, 2, 2);
                        }
                    }

                    // Бонусы
                    ctx.fillStyle = '#ffd166';
                    for (const item of snap.items) {
                        ctx.beginPath();
                        ctx.arc(item.x * sx, item.y * sy, 2, 0, Math.PI * 2);
                        ctx.fill();
                    }

                    // Танки
                    for (const t of snap.tanks) {
                        const isMe = t.playerId === myPlayerId;
                        ctx.fillStyle = isMe ? '#4da3ff' : '#ff6b6b';
                        ctx.beginPath();
                        ctx.arc(t.x * sx, t.y * sy, isMe ? 4 : 3, 0, Math.PI * 2);
                        ctx.fill();
                        if (isMe) {
                            // Индикатор направления башни
                            ctx.strokeStyle = '#fff';
                            ctx.lineWidth = 1;
                            ctx.beginPath();
                            ctx.moveTo(t.x * sx, t.y * sy);
                            ctx.lineTo(
                                t.x * sx + Math.cos(t.turretAngle) * 8,
                                t.y * sy + Math.sin(t.turretAngle) * 8
                            );
                            ctx.stroke();
                        }
                    }

                    // Рамка
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
                }
            }
            raf = requestAnimationFrame(draw);
        };
        raf = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(raf);
    }, [snapshotRef, myPlayerId]);

    return (
        <div className="minimap">
            <canvas ref={canvasRef} width={size} height={Math.round((size * 1080) / 1920)} className="minimap-canvas" />
        </div>
    );
};

export default Minimap;
