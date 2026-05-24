export function formatWholeStat(value: number): string {
    if (!Number.isFinite(value)) {
        return '0';
    }
    return String(Math.round(value));
}
