/**
 * Лёгкий менеджер звука без внешних аудио-файлов: все эффекты синтезируются
 * через Web Audio API. Это даёт читаемый аудио-фидбек «из коробки», пока
 * не добавим реальные sfx-ассеты. Замена на реальные сэмплы — в play*():
 * просто подменить тело метода на decodeAudioData + BufferSource.
 *
 * Громкость берётся из настроек через setVolumes(): эффекты слушают audio.sfx/ui,
 * master мастерится отдельным GainNode в цепочке.
 */
export type SfxId =
    | 'ui:click'
    | 'ui:error'
    | 'game:shot'
    | 'game:hit'
    | 'game:explosion'
    | 'game:pickup'
    | 'game:damageTaken'
    | 'game:kill';

interface Volumes {
    master: number;
    music: number;
    sfx: number;
    ui: number;
}

class SoundManagerImpl {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private sfxGain: GainNode | null = null;
    private uiGain: GainNode | null = null;
    private musicGain: GainNode | null = null;
    private muted = false;
    private volumes: Volumes = { master: 0.8, music: 0.4, sfx: 0.8, ui: 0.6 };

    /**
     * Таблица пользовательских ассетов. Если для SfxId есть буфер — играем его,
     * иначе fallback на встроенный синтезатор. URL'ы регистрируются через
     * registerAsset() / registerAssets() и подгружаются лениво при первом play().
     */
    private assetUrls: Partial<Record<SfxId, string>> = {};
    private assetBuffers: Partial<Record<SfxId, AudioBuffer>> = {};
    private assetLoading: Partial<Record<SfxId, Promise<AudioBuffer | null>>> = {};

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
     * Создаёт кратковременный тон/шум, направляет через sfxGain (или uiGain для ui:*)
     * и применяет pan ∈ [-1; 1] через StereoPannerNode.
     */
    /**
     * Зарегистрировать внешний аудио-ассет. Имя `id` должно совпадать с одним из
     * SfxId. URL загружается лениво при первом `play()`. Если загрузка не
     * удалась — используется синтезированный звук.
     */
    public registerAsset(id: SfxId, url: string): void {
        this.assetUrls[id] = url;
        // Не сбрасываем уже загруженный буфер — допускаем hot-swap через
        // повторный вызов с новым URL: тогда старый кеш останется до перезагрузки.
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

    public play(id: SfxId, opts?: { volume?: number; pan?: number }) {
        if (!this.ensure()) return;
        const ctx = this.ctx!;
        const now = ctx.currentTime;
        const pan = Math.max(-1, Math.min(1, opts?.pan ?? 0));
        const volume = Math.max(0, Math.min(1, opts?.volume ?? 1));
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
        // Буфер уже в кеше → играем сразу; иначе fire-and-forget, fallback на синтез.
        const cached = this.assetBuffers[id];
        if (cached) {
            this.playBuffer(out, now, cached);
            return;
        }
        if (this.assetUrls[id]) {
            // Пытаемся загрузить, но параллельно запускаем синтез, чтобы не было задержки.
            // При следующем вызове проиграет уже реальный ассет.
            void this.loadAssetOnce(id);
        }

        switch (id) {
            case 'ui:click':
                this.playTone(out, now, { freq: 880, durMs: 60, type: 'sine', gain: 0.25 });
                break;
            case 'ui:error':
                this.playTone(out, now, { freq: 180, durMs: 160, type: 'square', gain: 0.25 });
                break;
            case 'game:shot':
                // Короткий «чпок» — шум + нисходящий тон
                this.playNoise(out, now, 70, 0.25);
                this.playTone(out, now, { freq: 420, durMs: 100, type: 'sawtooth', gain: 0.18, freqEnd: 120 });
                break;
            case 'game:hit':
                this.playTone(out, now, { freq: 280, durMs: 80, type: 'triangle', gain: 0.2, freqEnd: 90 });
                break;
            case 'game:explosion':
                this.playNoise(out, now, 450, 0.35);
                this.playTone(out, now, { freq: 80, durMs: 400, type: 'sine', gain: 0.25, freqEnd: 40 });
                break;
            case 'game:pickup':
                this.playTone(out, now, { freq: 660, durMs: 100, type: 'sine', gain: 0.22, freqEnd: 990 });
                break;
            case 'game:damageTaken':
                this.playTone(out, now, { freq: 180, durMs: 140, type: 'square', gain: 0.24, freqEnd: 110 });
                break;
            case 'game:kill':
                this.playTone(out, now, { freq: 400, durMs: 100, type: 'sine', gain: 0.22, freqEnd: 700 });
                break;
        }
    }

    private playTone(
        dest: AudioNode,
        startAt: number,
        params: { freq: number; durMs: number; type: OscillatorType; gain: number; freqEnd?: number }
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
        const end = startAt + params.durMs / 1000;
        g.gain.setValueAtTime(0.0001, startAt);
        g.gain.exponentialRampToValueAtTime(params.gain, startAt + 0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, end);
        osc.connect(g);
        g.connect(dest);
        osc.start(startAt);
        osc.stop(end + 0.01);
    }

    private playBuffer(dest: AudioNode, startAt: number, buffer: AudioBuffer): void {
        if (!this.ctx) return;
        const src = this.ctx.createBufferSource();
        src.buffer = buffer;
        src.connect(dest);
        src.start(startAt);
    }

    private playNoise(dest: AudioNode, startAt: number, durMs: number, peakGain: number) {
        if (!this.ctx) return;
        const ctx = this.ctx;
        const length = Math.max(1, Math.floor((durMs / 1000) * ctx.sampleRate));
        const buf = ctx.createBuffer(1, length, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < length; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / length);
        }
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const g = ctx.createGain();
        g.gain.setValueAtTime(peakGain, startAt);
        g.gain.exponentialRampToValueAtTime(0.001, startAt + durMs / 1000);
        src.connect(g);
        g.connect(dest);
        src.start(startAt);
        src.stop(startAt + durMs / 1000 + 0.02);
    }
}

export const SoundManager = new SoundManagerImpl();

/**
 * Помощник: pan и volume для звука источником в мировых координатах относительно
 * игрока-камеры. Громкость спадает линейно до нуля на расстоянии maxDist.
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
    const volume = 1 - dist / maxDist;
    // Ограничиваем pan, чтобы не было слишком сильного отката при близком звуке
    const pan = Math.max(-1, Math.min(1, dx / (maxDist * 0.7)));
    return { pan, volume };
}
