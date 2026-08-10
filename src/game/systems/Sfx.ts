/**
 * Procedural sound effects synthesized with the Web Audio API — no external
 * audio assets, so nothing to license. Tones are short and muted to match the
 * dark fairy-tale mood (no bright/arcade or neon-synth flourishes).
 *
 * A single shared instance is used across scene restarts to avoid spawning many
 * AudioContexts. The context starts suspended and is resumed on the first sound
 * (which is always triggered from a key/pointer gesture).
 */
class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;

  constructor() {
    const AC: typeof AudioContext | undefined =
      window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    try {
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.22;
      this.master.connect(this.ctx.destination);
    } catch {
      this.ctx = null;
    }
  }

  private resume(): void {
    if (this.ctx && this.ctx.state === "suspended") void this.ctx.resume();
  }

  /** A single decaying oscillator note, optionally sliding in pitch. */
  private tone(
    freq: number,
    durationMs: number,
    type: OscillatorType,
    gain: number,
    slideToFreq?: number,
  ): void {
    if (!this.ctx || !this.master) return;
    this.resume();
    const now = this.ctx.currentTime;
    const dur = durationMs / 1000;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideToFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideToFreq), now + dur);
    env.gain.setValueAtTime(gain, now);
    env.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(env);
    env.connect(this.master);
    osc.start(now);
    osc.stop(now + dur);
  }

  /** A filtered white-noise burst, for impacts. */
  private noise(durationMs: number, gain: number, filterFreq: number): void {
    if (!this.ctx || !this.master) return;
    this.resume();
    const now = this.ctx.currentTime;
    const dur = durationMs / 1000;
    const frames = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, frames, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = filterFreq;
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(gain, now);
    env.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.connect(filter);
    filter.connect(env);
    env.connect(this.master);
    src.start(now);
    src.stop(now + dur);
  }

  jump(): void {
    this.tone(280, 160, "square", 0.22, 560);
  }
  dash(): void {
    this.tone(520, 150, "sawtooth", 0.18, 120);
  }
  attack(): void {
    this.tone(240, 90, "square", 0.2, 150);
    this.noise(90, 0.12, 2600);
  }
  hit(): void {
    this.noise(110, 0.25, 1800);
    this.tone(160, 90, "triangle", 0.18, 90);
  }
  enemyDeath(): void {
    this.tone(300, 320, "sawtooth", 0.2, 70);
    this.noise(260, 0.18, 1200);
  }
  hurt(): void {
    this.tone(180, 240, "square", 0.24, 70);
  }
  echo(): void {
    this.tone(660, 300, "sine", 0.16, 990);
  }
  lever(): void {
    this.tone(180, 70, "square", 0.2);
    this.noise(60, 0.1, 2000);
  }
  door(): void {
    this.tone(90, 420, "sine", 0.22, 60);
  }
  support(): void {
    this.tone(440, 260, "sine", 0.18, 880);
  }
}

/** Shared instance (survives scene restarts). */
export const sfx = new Sfx();
