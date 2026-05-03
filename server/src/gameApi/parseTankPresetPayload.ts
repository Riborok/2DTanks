import type { TankPresetInput } from '../repos/tankPresetRepo';
import { PRESET_NAME_MAX_LEN } from '../repos/tankPresetRepo';

export function parseTankPresetPayload(body: unknown):
    | { ok: true; value: TankPresetInput }
    | { ok: false; message: string } {
    if (!body || typeof body !== 'object') {
        return { ok: false as const, message: 'Некорректные данные' };
    }
    const raw = body as Record<string, unknown>;
    const nameInput = typeof raw.name === 'string' ? raw.name.trim() : '';
    if (nameInput.length === 0) {
        return { ok: false as const, message: 'Название обязательно' };
    }
    if (nameInput.length > PRESET_NAME_MAX_LEN) {
        return { ok: false as const, message: `Название длиннее ${PRESET_NAME_MAX_LEN} символов` };
    }
    const nums: Record<string, number> = {};
    for (const key of ['color', 'hullNum', 'trackNum', 'turretNum', 'weaponNum'] as const) {
        const v = raw[key];
        if (typeof v !== 'number' || !Number.isInteger(v) || v < 0 || v > 15) {
            return { ok: false as const, message: `Некорректное поле ${key}` };
        }
        nums[key] = v;
    }
    return {
        ok: true as const,
        value: {
            name: nameInput,
            color: nums.color,
            hullNum: nums.hullNum,
            trackNum: nums.trackNum,
            turretNum: nums.turretNum,
            weaponNum: nums.weaponNum
        }
    };
}
