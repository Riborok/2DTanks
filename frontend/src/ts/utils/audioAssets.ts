import { SoundManager, SfxId } from './SoundManager';

/**
 * Реестр внешних аудио-ассетов (CC0, Kenney). Файлы лежат в /src/audio/
 * и сервируются как обычные статические ресурсы (nginx + service-worker
 * stale-while-revalidate). При первом проигрывании конкретного звука
 * BufferSource подгружается лениво — fallback на синтезатор работает,
 * пока буфер ещё не декодирован, чтобы не было задержки на первом
 * выстреле/попадании.
 *
 * Подменить любой звук можно одной строкой ниже — без правки SoundManager.
 */
const ASSETS: Partial<Record<SfxId, string>> = {
    'ui:click': '/src/audio/ui_click.ogg',
    'ui:error': '/src/audio/ui_error.ogg',
    /** Общий fallback (редко); выстрелы по типу — `game:shot0`…`game:shot4` */
    'game:shot': '/src/audio/shot_medium.ogg',
    'game:shot0': '/src/audio/shot_light.ogg',
    'game:shot1': '/src/audio/shot_medium.ogg',
    'game:shot2': '/src/audio/shot_heavy.ogg',
    'game:shot3': '/src/audio/shot_sniper.ogg',
    'game:shot4': '/src/audio/shot_grenade.ogg',
    'game:hit': '/src/audio/hit_metal.ogg',
    'game:wallHit': '/src/audio/hit_wall.ogg',
    'game:explosion': '/src/audio/explosion.ogg',
    'game:collision': '/src/audio/collision.ogg',
    'game:crateBreak': '/src/audio/crate_break.ogg',
    'game:pickup': '/src/audio/pickup.ogg',
    'game:damageTaken': '/src/audio/damage_taken.ogg',
    'game:kill': '/src/audio/kill.ogg'
};

let registered = false;

export function registerAudioAssets(): void {
    if (registered) return;
    registered = true;
    SoundManager.registerAssets(ASSETS);
}
