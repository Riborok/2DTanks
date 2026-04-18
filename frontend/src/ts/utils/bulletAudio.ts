import type { SfxId } from './SoundManager';

/** Отдельный ассет выстрела для каждого типа (`game:shot0` … `game:shot4`). */
export function shotSfxIdForBulletType(type: number): SfxId {
    const t = Math.max(0, Math.min(4, Math.floor(type)));
    return (`game:shot${t}` as SfxId);
}

/** Лёгкая вариация «металл» по калибру (один файл, разный playbackRate). */
export function hitMetalPlaybackRateForBulletType(type: number): number {
    const t = Math.max(0, Math.min(4, Math.floor(type)));
    return 1.12 - t * 0.055;
}

/** Вариация удара по стене/земле по калибру. */
export function wallHitPlaybackRateForBulletType(type: number): number {
    const t = Math.max(0, Math.min(4, Math.floor(type)));
    return 0.92 + t * 0.038;
}
