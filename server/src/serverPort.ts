/**
 * Порт HTTP + WebSocket. Не путать с портом PostgreSQL в DATABASE_URL (часто 5432).
 * SERVER_PORT имеет приоритет над PORT (чтобы IDE/оболочка не подставляли «чужой» PORT).
 */
const DB_LIKE_PORTS = new Set([5432, 5433, 3306, 1433, 27017]);

function parsePositiveInt(raw: string | undefined): number | null {
    if (raw === undefined || raw === '') {
        return null;
    }
    const n = Number(raw.trim());
    if (!Number.isFinite(n) || n < 1 || n > 65535) {
        return null;
    }
    return Math.trunc(n);
}

export function resolveListenPort(): number {
    const dedicated = parsePositiveInt(process.env.SERVER_PORT);
    if (dedicated !== null) {
        return dedicated;
    }

    const fromPort = parsePositiveInt(process.env.PORT);
    if (fromPort !== null) {
        if (DB_LIKE_PORTS.has(fromPort)) {
            console.warn(
                `[server] PORT=${fromPort} похож на порт СУБД, а не HTTP. ` +
                    `Слушаем 3000. Задайте SERVER_PORT=3000 в server/.env или исправьте PORT.`
            );
            return 3000;
        }
        return fromPort;
    }

    return 3000;
}
