import { parseTankPresetPayload } from '../../src/gameApi/parseTankPresetPayload';
import { PRESET_NAME_MAX_LEN } from '../../src/repos/tankPresetRepo';

describe('parseTankPresetPayload', () => {
    it('rejects non-object body', () => {
        expect(parseTankPresetPayload(null).ok).toBe(false);
        expect(parseTankPresetPayload(undefined).ok).toBe(false);
        expect(parseTankPresetPayload('x').ok).toBe(false);
        expect(parseTankPresetPayload(42).ok).toBe(false);
    });

    it('rejects empty name', () => {
        const r = parseTankPresetPayload({
            name: '   ',
            color: 1,
            hullNum: 1,
            trackNum: 1,
            turretNum: 1,
            weaponNum: 1
        });
        expect(r.ok).toBe(false);
        if (r.ok === false) {
            expect(r.message).toContain('Название');
        }
    });

    it('rejects name longer than max', () => {
        const r = parseTankPresetPayload({
            name: 'a'.repeat(PRESET_NAME_MAX_LEN + 1),
            color: 0,
            hullNum: 0,
            trackNum: 0,
            turretNum: 0,
            weaponNum: 0
        });
        expect(r.ok).toBe(false);
    });

    it('rejects non-integer numeric fields', () => {
        const r = parseTankPresetPayload({
            name: 'ok',
            color: 1.5,
            hullNum: 1,
            trackNum: 1,
            turretNum: 1,
            weaponNum: 1
        });
        expect(r.ok).toBe(false);
        if (r.ok === false) {
            expect(r.message).toContain('color');
        }
    });

    it('rejects out-of-range part indices', () => {
        const r = parseTankPresetPayload({
            name: 'ok',
            color: 16,
            hullNum: 1,
            trackNum: 1,
            turretNum: 1,
            weaponNum: 1
        });
        expect(r.ok).toBe(false);
    });

    it('accepts valid payload', () => {
        const r = parseTankPresetPayload({
            name: '  My preset  ',
            color: 15,
            hullNum: 0,
            trackNum: 7,
            turretNum: 3,
            weaponNum: 2
        });
        expect(r.ok).toBe(true);
        if (r.ok) {
            expect(r.value.name).toBe('My preset');
            expect(r.value.color).toBe(15);
        }
    });
});
