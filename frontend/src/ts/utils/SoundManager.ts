/**
 * Менеджер звука без внешних аудио-файлов: все эффекты синтезируются
 * через Web Audio API с использованием фильтров (BiquadFilter), нескольких
 * слоёв (sub-bass + body + crack + tail) и небольшой случайной вариации,
 * чтобы повторные срабатывания не звучали роботизированно.
 *
 * Дизайн ориентирован на реализм танковых эффектов:
 *   - shot       — артиллерийский выстрел: короткий «клик» дульного среза +
 *                  низкий «удар» + затухающий хвост шума.
 *   - explosion  — мощный взрыв: суб-бас, белый шум через low-pass,
 *                  яркий «крэк» сверху и долгий рокочущий хвост.
 *   - hit        — пуля по броне: металлический «звонкий» удар через bandpass.
 *   - wallHit    — пуля по бетону/земле: глухой «тук» через lowpass.
 *   - collision  — удар корпуса: играется по событию hullCollisions из
 *                  снапшота (сервер фиксирует нормальный импульс контакта),
 *                  а не по клиентским эвристикам движения.
 *   - crateBreak — разлом ящика: древесный «крак» + россыпь обломков.
 *
 * Громкость берётся из настроек через setVolumes(). При наличии внешнего
 * ассета (registerAsset) играем его BufferSource; иначе — синтез ниже.
 */
export type SfxId =
    | 'ui:click'
    | 'ui:error'
    | 'game:shot'
    | 'game:shot0'
    | 'game:shot1'
    | 'game:shot2'
    | 'game:shot3'
    | 'game:shot4'
    | 'game:hit'
    | 'game:wallHit'
    | 'game:explosion'
    | 'game:collision'
    | 'game:crateBreak'
    | 'game:pickup'
    | 'game:damageTaken'
    | 'game:kill';

interface Volumes {
    master: number;
    music: number;
    sfx: number;
    ui: number;
}

export type ReplaySoundCue = {
    key: string;
    id: SfxId;
    timeMs: number;
    volume?: number;
    pan?: number;
    playbackRate?: number;
};

type ReplaySoundSource = {
    source: AudioBufferSourceNode;
    anchorPositionMs: number;
    anchorContextTime: number;
    timelineSpeed: number;
    playbackRate: number;
};

class SoundManagerImpl {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private sfxGain: GainNode | null = null;
    private uiGain: GainNode | null = null;
    private musicGain: GainNode | null = null;
    private muted = false;
    private volumes: Volumes = { master: 0.8, music: 0.4, sfx: 0.8, ui: 0.6 };

    /**
     * Кеш предрассчитанных шумовых буферов разной длительности (в сек).
     * Регенерация белого шума на каждый выстрел — это лишние аллокации,
     * поэтому держим пул и переиспользуем (BufferSource одноразовый, а
     * сам AudioBuffer — нет).
     */
    private noiseBuffers: Map<number, AudioBuffer> = new Map();

    /**
     * Таблица пользовательских ассетов. Если для SfxId есть буфер — играем его,
     * иначе fallback на встроенный синтезатор. URL'ы регистрируются через
     * registerAsset() / registerAssets() и подгружаются лениво при первом play().
     */
    private assetUrls: Partial<Record<SfxId, string>> = {};
    private assetBuffers: Partial<Record<SfxId, AudioBuffer>> = {};
    private assetLoading: Partial<Record<SfxId, Promise<AudioBuffer | null>>> = {};
    private readonly replaySources = new Map<string, ReplaySoundSource>();

    /**
     * Браузеры разрешают AudioContext только после user-gesture. Вызываем ensure()
     * из любого обработчика клика/тача — контекст создаётся лениво и переиспользуется.
     */
    private ensure(): boolean {
        if (this.muted) return false;
        if (this.ctx && this.ctx.state !== 'closed') {
            if (this.ctx.state === 'suspended') {
                this.ctx.resume().catch(() => {});
            }
            return true;
        }
        const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (!AC) return false;
        try {
            this.ctx = new AC();
        } catch {
            return false;
        }
        const ctx = this.ctx!;
        this.masterGain = ctx.createGain();
        this.sfxGain = ctx.createGain();
        this.uiGain = ctx.createGain();
        this.musicGain = ctx.createGain();
        this.sfxGain.connect(this.masterGain);
        this.uiGain.connect(this.masterGain);
        this.musicGain.connect(this.masterGain);
        this.masterGain.connect(ctx.destination);
        this.applyVolumes();
        // Сразу после получения AudioContext (который требует user-gesture)
        // прогреваем все зарегистрированные внешние ассеты, чтобы первый
        // выстрел/удар играл реальный звук, а не синтез-фолбэк.
        for (const id of Object.keys(this.assetUrls) as SfxId[]) {
            void this.loadAssetOnce(id);
        }
        return true;
    }

    public setVolumes(v: Volumes) {
        this.volumes = { ...v };
        this.applyVolumes();
    }

    public setMuted(m: boolean) {
        this.muted = m;
        this.applyVolumes();
    }

    private applyVolumes() {
        if (!this.masterGain || !this.sfxGain || !this.uiGain || !this.musicGain) return;
        const eff = this.muted ? 0 : 1;
        this.masterGain.gain.value = this.volumes.master * eff;
        this.sfxGain.gain.value = this.volumes.sfx;
        this.uiGain.gain.value = this.volumes.ui;
        this.musicGain.gain.value = this.volumes.music;
    }

    /**
     * Зарегистрировать внешний аудио-ассет. Имя `id` должно совпадать с одним из
     * SfxId. URL загружается лениво при первом `play()`. Если загрузка не
     * удалась — используется синтезированный звук.
     */
    public registerAsset(id: SfxId, url: string): void {
        this.assetUrls[id] = url;
    }

    public registerAssets(map: Partial<Record<SfxId, string>>): void {
        for (const k of Object.keys(map) as SfxId[]) {
            const url = map[k];
            if (url) this.registerAsset(k, url);
        }
    }

    private loadAssetOnce(id: SfxId): Promise<AudioBuffer | null> {
        if (this.assetBuffers[id]) return Promise.resolve(this.assetBuffers[id]!);
        if (this.assetLoading[id]) return this.assetLoading[id]!;
        const url = this.assetUrls[id];
        if (!url || !this.ctx) return Promise.resolve(null);
        const ctx = this.ctx;
        const p = (async () => {
            try {
                const resp = await fetch(url);
                if (!resp.ok) return null;
                const buf = await resp.arrayBuffer();
                return await new Promise<AudioBuffer>((resolve, reject) => {
                    ctx.decodeAudioData(
                        buf,
                        (decoded) => resolve(decoded),
                        (err) => reject(err)
                    );
                });
            } catch {
                return null;
            }
        })().then((buf) => {
            if (buf) this.assetBuffers[id] = buf;
            this.assetLoading[id] = undefined as any;
            return buf;
        });
        this.assetLoading[id] = p;
        return p;
    }

    public play(id: SfxId, opts?: { volume?: number; pan?: number; playbackRate?: number }) {
        if (!this.ensure()) return;
        const ctx = this.ctx!;
        const now = ctx.currentTime;
        const pan = Math.max(-1, Math.min(1, opts?.pan ?? 0));
        const volume = Math.max(0, Math.min(1, opts?.volume ?? 1));
        const playbackRate = Math.max(0.25, Math.min(4, opts?.playbackRate ?? 1));
        // Игнорируем неслышные звуки (далеко за радиусом слышимости),
        // чтобы не плодить осцилляторы впустую.
        if (volume < 0.01) return;
        const target = id.startsWith('ui:') ? this.uiGain! : this.sfxGain!;

        const out = ctx.createGain();
        out.gain.value = volume;
        const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        if (panner) {
            panner.pan.value = pan;
            out.connect(panner);
            panner.connect(target);
        } else {
            out.connect(target);
        }

        // Если зарегистрирован внешний ассет — используем BufferSource.
        const cached = this.assetBuffers[id];
        if (cached) {
            this.playBuffer(out, now, cached, playbackRate);
            return;
        }
        if (this.assetUrls[id]) {
            void this.loadAssetOnce(id);
        }

        switch (id) {
            case 'ui:click':
                this.synthUiClick(out, now);
                break;
            case 'ui:error':
                this.synthUiError(out, now);
                break;
            case 'game:shot':
            case 'game:shot0':
            case 'game:shot1':
            case 'game:shot2':
            case 'game:shot3':
            case 'game:shot4':
                this.synthShot(out, now);
                break;
            case 'game:hit':
                this.synthMetalHit(out, now);
                break;
            case 'game:wallHit':
                this.synthWallHit(out, now);
                break;
            case 'game:explosion':
                this.synthExplosion(out, now);
                break;
            case 'game:collision':
                this.synthCollision(out, now);
                break;
            case 'game:crateBreak':
                this.synthCrateBreak(out, now);
                break;
            case 'game:pickup':
                this.synthPickup(out, now);
                break;
            case 'game:damageTaken':
                this.synthDamageTaken(out, now);
                break;
            case 'game:kill':
                this.synthKill(out, now);
                break;
        }
    }

    public stopReplaySounds(): void {
        for (const active of this.replaySources.values()) {
            try {
                active.source.stop();
            } catch {
                // Already stopped by the audio engine.
            }
        }
        this.replaySources.clear();
    }

    public syncReplaySounds(cues: ReplaySoundCue[], positionMs: number, timelineSpeed: number): void {
        if (timelineSpeed <= 0 || !this.ensure() || !this.ctx) {
            this.stopReplaySounds();
            return;
        }

        const ctx = this.ctx;
        const activeKeys = new Set<string>();
        let low = 0;
        let high = cues.length - 1;
        let lastStartedIndex = -1;
        while (low <= high) {
            const middle = Math.floor((low + high) / 2);
            if (cues[middle].timeMs <= positionMs) {
                lastStartedIndex = middle;
                low = middle + 1;
            } else {
                high = middle - 1;
            }
        }
        for (let index = lastStartedIndex; index >= 0; index--) {
            const cue = cues[index];
            const baseRate = Math.max(0.25, Math.min(4, cue.playbackRate ?? 1));
            const elapsedMs = positionMs - cue.timeMs;
            if (elapsedMs > 5000) {
                break;
            }

            const buffer = this.assetBuffers[cue.id];
            if (!buffer) {
                if (this.assetUrls[cue.id]) {
                    void this.loadAssetOnce(cue.id);
                }
                continue;
            }

            const offsetSec = (elapsedMs / 1000) * baseRate;
            if (offsetSec >= buffer.duration) {
                continue;
            }
            activeKeys.add(cue.key);

            const current = this.replaySources.get(cue.key);
            const expectedElapsedMs = current
                ? current.anchorPositionMs + (ctx.currentTime - current.anchorContextTime) * 1000 * current.timelineSpeed
                : 0;
            const inSync =
                current &&
                current.timelineSpeed === timelineSpeed &&
                current.playbackRate === baseRate &&
                Math.abs(expectedElapsedMs - positionMs) < 80;
            if (inSync) {
                continue;
            }
            if (current) {
                try {
                    current.source.stop();
                } catch {
                    // Already stopped by the audio engine.
                }
                this.replaySources.delete(cue.key);
            }

            const target = cue.id.startsWith('ui:') ? this.uiGain! : this.sfxGain!;
            const out = ctx.createGain();
            out.gain.value = Math.max(0, Math.min(1, cue.volume ?? 1));
            const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
            if (panner) {
                panner.pan.value = Math.max(-1, Math.min(1, cue.pan ?? 0));
                out.connect(panner);
                panner.connect(target);
            } else {
                out.connect(target);
            }

            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.playbackRate.value = Math.max(0.25, Math.min(4, baseRate * timelineSpeed));
            source.connect(out);
            source.start(ctx.currentTime, offsetSec);
            source.onended = () => {
                if (this.replaySources.get(cue.key)?.source === source) {
                    this.replaySources.delete(cue.key);
                }
            };
            this.replaySources.set(cue.key, {
                source,
                anchorPositionMs: positionMs,
                anchorContextTime: ctx.currentTime,
                timelineSpeed,
                playbackRate: baseRate
            });
        }

        for (const [key, active] of this.replaySources) {
            if (!activeKeys.has(key)) {
                try {
                    active.source.stop();
                } catch {
                    // Already stopped by the audio engine.
                }
                this.replaySources.delete(key);
            }
        }
    }

    // -------------------------------------------------------------------------
    // Низкоуровневые помощники
    // -------------------------------------------------------------------------

    /** Шумовой буфер фиксированной длительности (кеширован). Без затухания. */
    private getNoiseBuffer(durSec: number): AudioBuffer | null {
        if (!this.ctx) return null;
        const key = Math.max(0.02, Math.round(durSec * 100) / 100);
        const cached = this.noiseBuffers.get(key);
        if (cached) return cached;
        const length = Math.max(1, Math.floor(key * this.ctx.sampleRate));
        const buf = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < length; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        this.noiseBuffers.set(key, buf);
        return buf;
    }

    /**
     * Шумовой источник через BiquadFilter с экспоненциальной огибающей. Гибкий
     * примитив: подобрав type/freq/Q можно собрать почти любой ударный звук.
     */
    private playFilteredNoise(
        dest: AudioNode,
        startAt: number,
        params: {
            durMs: number;
            peakGain: number;
            filterType: BiquadFilterType;
            freq: number;
            freqEnd?: number;
            Q?: number;
            attackMs?: number;
        }
    ): void {
        if (!this.ctx) return;
        const ctx = this.ctx;
        const dur = params.durMs / 1000;
        const noise = this.getNoiseBuffer(Math.max(0.05, dur));
        if (!noise) return;
        const src = ctx.createBufferSource();
        src.buffer = noise;
        const filter = ctx.createBiquadFilter();
        filter.type = params.filterType;
        filter.frequency.setValueAtTime(params.freq, startAt);
        if (typeof params.freqEnd === 'number') {
            filter.frequency.exponentialRampToValueAtTime(
                Math.max(20, params.freqEnd),
                startAt + dur
            );
        }
        filter.Q.value = params.Q ?? 1;

        const g = ctx.createGain();
        const attack = (params.attackMs ?? 3) / 1000;
        g.gain.setValueAtTime(0.0001, startAt);
        g.gain.exponentialRampToValueAtTime(params.peakGain, startAt + attack);
        g.gain.exponentialRampToValueAtTime(0.0001, startAt + dur);

        src.connect(filter);
        filter.connect(g);
        g.connect(dest);
        src.start(startAt);
        src.stop(startAt + dur + 0.02);
    }

    /**
     * Тон с возможностью свипа частоты и (опционально) фильтром на выходе.
     * Для синусоидальных «бумов» и «ударов» через lowpass-секцию.
     */
    private playTone(
        dest: AudioNode,
        startAt: number,
        params: {
            freq: number;
            durMs: number;
            type: OscillatorType;
            gain: number;
            freqEnd?: number;
            attackMs?: number;
            filter?: { type: BiquadFilterType; freq: number; Q?: number };
        }
    ) {
        if (!this.ctx) return;
        const ctx = this.ctx;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = params.type;
        osc.frequency.setValueAtTime(params.freq, startAt);
        if (typeof params.freqEnd === 'number') {
            osc.frequency.exponentialRampToValueAtTime(
                Math.max(20, params.freqEnd),
                startAt + params.durMs / 1000
            );
        }
        const dur = params.durMs / 1000;
        const attack = (params.attackMs ?? 3) / 1000;
        g.gain.setValueAtTime(0.0001, startAt);
        g.gain.exponentialRampToValueAtTime(params.gain, startAt + attack);
        g.gain.exponentialRampToValueAtTime(0.0001, startAt + dur);
        osc.connect(g);
        if (params.filter) {
            const f = ctx.createBiquadFilter();
            f.type = params.filter.type;
            f.frequency.value = params.filter.freq;
            f.Q.value = params.filter.Q ?? 1;
            g.connect(f);
            f.connect(dest);
        } else {
            g.connect(dest);
        }
        osc.start(startAt);
        osc.stop(startAt + dur + 0.02);
    }

    private playBuffer(dest: AudioNode, startAt: number, buffer: AudioBuffer, playbackRate = 1): void {
        if (!this.ctx) return;
        const src = this.ctx.createBufferSource();
        src.buffer = buffer;
        src.playbackRate.value = playbackRate;
        src.connect(dest);
        src.start(startAt);
    }

    private rand(min: number, max: number): number {
        return min + Math.random() * (max - min);
    }

    // -------------------------------------------------------------------------
    // Синтез отдельных эффектов
    // -------------------------------------------------------------------------

    private synthUiClick(dest: AudioNode, t: number): void {
        this.playTone(dest, t, { freq: 880, durMs: 50, type: 'sine', gain: 0.22 });
    }

    private synthUiError(dest: AudioNode, t: number): void {
        this.playTone(dest, t, {
            freq: 200,
            durMs: 160,
            type: 'square',
            gain: 0.22,
            freqEnd: 110
        });
    }

    /**
     * Танковый выстрел. Слои:
     *   1) Дульный «клик» — короткий highpass-noise (≤8 мс) для атаки.
     *   2) Низкий «удар» — sine 90→35 Гц с быстрым спадом, даёт грудной thump.
     *   3) Тело — bandpass-noise около 200–400 Гц, ~120 мс.
     *   4) Хвост — lowpass-noise, ~250 мс, имитация эха выстрела на местности.
     * Случайные лёгкие отстройки частот не дают звучать одинаково.
     */
    private synthShot(dest: AudioNode, t: number): void {
        const punchFreq = this.rand(85, 100);
        const bodyFreq = this.rand(220, 320);
        // Резкая атака — щелчок дульного среза
        this.playFilteredNoise(dest, t, {
            durMs: 25,
            peakGain: 0.5,
            filterType: 'highpass',
            freq: 3500,
            attackMs: 1
        });
        // Низкочастотный удар: «бум» от ствола
        this.playTone(dest, t, {
            freq: punchFreq,
            durMs: 220,
            type: 'sine',
            gain: 0.55,
            freqEnd: 32,
            attackMs: 2
        });
        // Тело выстрела — резонансный шум
        this.playFilteredNoise(dest, t + 0.005, {
            durMs: 130,
            peakGain: 0.35,
            filterType: 'bandpass',
            freq: bodyFreq,
            freqEnd: 140,
            Q: 1.4,
            attackMs: 2
        });
        // Хвост — раскат
        this.playFilteredNoise(dest, t + 0.02, {
            durMs: 280,
            peakGain: 0.2,
            filterType: 'lowpass',
            freq: 600,
            freqEnd: 200,
            Q: 0.7,
            attackMs: 6
        });
    }

    /**
     * Взрыв. Сильный, объёмный, с долгим хвостом.
     *   1) Sub-bass — sine 55→22 Гц, 600 мс.
     *   2) Боди — lowpass-noise, 450 мс, имитация газового хлопка.
     *   3) Крэк — bandpass на 1.6 кГц, короткая яркая вспышка.
     *   4) Хвост-рокот — lowpass на 90→50 Гц, ~900 мс.
     */
    private synthExplosion(dest: AudioNode, t: number): void {
        const sub = this.rand(50, 60);
        // Crack — самый верх, мгновенная атака
        this.playFilteredNoise(dest, t, {
            durMs: 80,
            peakGain: 0.35,
            filterType: 'bandpass',
            freq: 1700,
            Q: 0.6,
            attackMs: 1
        });
        // Sub-bass thump
        this.playTone(dest, t, {
            freq: sub,
            durMs: 700,
            type: 'sine',
            gain: 0.7,
            freqEnd: 22,
            attackMs: 4
        });
        // Body — газовый хлопок
        this.playFilteredNoise(dest, t + 0.005, {
            durMs: 480,
            peakGain: 0.55,
            filterType: 'lowpass',
            freq: 900,
            freqEnd: 200,
            Q: 0.7,
            attackMs: 4
        });
        // Длинный хвост-рокот
        this.playFilteredNoise(dest, t + 0.04, {
            durMs: 950,
            peakGain: 0.28,
            filterType: 'lowpass',
            freq: 140,
            freqEnd: 60,
            Q: 0.5,
            attackMs: 12
        });
    }

    /**
     * Пуля по броне — звонкий металлический «динь».
     * Bandpass-noise высокого тона + лёгкий короткий thump.
     */
    private synthMetalHit(dest: AudioNode, t: number): void {
        const ring = this.rand(1500, 2400);
        this.playFilteredNoise(dest, t, {
            durMs: 18,
            peakGain: 0.45,
            filterType: 'highpass',
            freq: 5000,
            attackMs: 1
        });
        this.playFilteredNoise(dest, t, {
            durMs: 180,
            peakGain: 0.4,
            filterType: 'bandpass',
            freq: ring,
            freqEnd: ring * 0.85,
            Q: 6,
            attackMs: 1
        });
        this.playTone(dest, t, {
            freq: 280,
            durMs: 70,
            type: 'triangle',
            gain: 0.18,
            freqEnd: 90,
            attackMs: 2
        });
    }

    /**
     * Пуля по стене/ящику/земле — глухой «тук» без металлического звона.
     */
    private synthWallHit(dest: AudioNode, t: number): void {
        this.playFilteredNoise(dest, t, {
            durMs: 90,
            peakGain: 0.42,
            filterType: 'lowpass',
            freq: 700,
            freqEnd: 250,
            Q: 0.7,
            attackMs: 1
        });
        this.playTone(dest, t, {
            freq: 130,
            durMs: 120,
            type: 'sine',
            gain: 0.32,
            freqEnd: 60,
            attackMs: 2
        });
        // Лёгкие «осколки» сверху
        this.playFilteredNoise(dest, t + 0.01, {
            durMs: 80,
            peakGain: 0.12,
            filterType: 'bandpass',
            freq: 2200,
            Q: 1.2,
            attackMs: 2
        });
    }

    /**
     * Столкновение танка (с танком/стеной/ящиком) — тяжёлый металлический клэнк
     * с лёгкой вибрацией стали и низким рокотом массы.
     */
    private synthCollision(dest: AudioNode, t: number): void {
        const clankFreq = this.rand(380, 520);
        // Основной CLANK — резонансный bandpass
        this.playFilteredNoise(dest, t, {
            durMs: 220,
            peakGain: 0.5,
            filterType: 'bandpass',
            freq: clankFreq,
            Q: 8,
            attackMs: 1
        });
        // Высокий «лязг» поверх (металл)
        this.playFilteredNoise(dest, t, {
            durMs: 110,
            peakGain: 0.22,
            filterType: 'bandpass',
            freq: clankFreq * 3.7,
            Q: 5,
            attackMs: 1
        });
        // Низкий thump — масса танка
        this.playTone(dest, t + 0.005, {
            freq: 90,
            durMs: 160,
            type: 'sine',
            gain: 0.4,
            freqEnd: 45,
            attackMs: 2
        });
        // Хвост — короткий рокот шасси
        this.playFilteredNoise(dest, t + 0.02, {
            durMs: 220,
            peakGain: 0.14,
            filterType: 'lowpass',
            freq: 280,
            freqEnd: 120,
            Q: 0.6,
            attackMs: 8
        });
    }

    /**
     * Разлом ящика — древесный «крак» + россыпь обломков.
     */
    private synthCrateBreak(dest: AudioNode, t: number): void {
        // Короткий древесный крэк
        this.playFilteredNoise(dest, t, {
            durMs: 50,
            peakGain: 0.45,
            filterType: 'bandpass',
            freq: 1800,
            Q: 3,
            attackMs: 1
        });
        // Низкий «уф» массы
        this.playTone(dest, t, {
            freq: 160,
            durMs: 180,
            type: 'triangle',
            gain: 0.3,
            freqEnd: 70,
            attackMs: 2
        });
        // Россыпь обломков
        this.playFilteredNoise(dest, t + 0.04, {
            durMs: 240,
            peakGain: 0.2,
            filterType: 'bandpass',
            freq: 900,
            freqEnd: 500,
            Q: 1.2,
            attackMs: 6
        });
        // Лёгкий «шуршащий» хвост
        this.playFilteredNoise(dest, t + 0.08, {
            durMs: 180,
            peakGain: 0.1,
            filterType: 'highpass',
            freq: 2500,
            attackMs: 8
        });
    }

    private synthPickup(dest: AudioNode, t: number): void {
        this.playTone(dest, t, {
            freq: 660,
            durMs: 90,
            type: 'sine',
            gain: 0.22,
            freqEnd: 1320,
            attackMs: 2
        });
        this.playTone(dest, t + 0.06, {
            freq: 990,
            durMs: 120,
            type: 'sine',
            gain: 0.18,
            freqEnd: 1480,
            attackMs: 2
        });
    }

    private synthDamageTaken(dest: AudioNode, t: number): void {
        // Тревожный low-mid удар по корпусу
        this.playFilteredNoise(dest, t, {
            durMs: 120,
            peakGain: 0.35,
            filterType: 'lowpass',
            freq: 500,
            freqEnd: 180,
            Q: 0.7,
            attackMs: 1
        });
        this.playTone(dest, t, {
            freq: 200,
            durMs: 160,
            type: 'sawtooth',
            gain: 0.2,
            freqEnd: 95,
            attackMs: 2
        });
    }

    private synthKill(dest: AudioNode, t: number): void {
        // Короткая «победная» секвенция, не торжественная
        this.playTone(dest, t, {
            freq: 520,
            durMs: 90,
            type: 'sine',
            gain: 0.22,
            freqEnd: 760,
            attackMs: 2
        });
        this.playTone(dest, t + 0.07, {
            freq: 760,
            durMs: 130,
            type: 'sine',
            gain: 0.2,
            freqEnd: 980,
            attackMs: 2
        });
    }
}

export const SoundManager = new SoundManagerImpl();

/**
 * Помощник: pan и volume для звука источником в мировых координатах относительно
 * игрока-камеры. Громкость спадает плавно (квадратично) до нуля на расстоянии maxDist.
 */
export function spatial(
    sourceX: number,
    sourceY: number,
    listenerX: number,
    listenerY: number,
    maxDist: number
): { pan: number; volume: number } {
    const dx = sourceX - listenerX;
    const dy = sourceY - listenerY;
    const dist = Math.hypot(dx, dy);
    if (dist >= maxDist) return { pan: 0, volume: 0 };
    // Квадратичный спад звучит естественнее линейного: ближние звуки громче,
    // дальние быстрее уходят в фон.
    const k = 1 - dist / maxDist;
    const volume = k * k;
    const pan = Math.max(-1, Math.min(1, dx / (maxDist * 0.7)));
    return { pan, volume };
}
