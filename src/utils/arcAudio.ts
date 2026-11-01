/**
 * Synthesised welding arc sound (Web Audio API, no audio files).
 *
 * Each process is modelled on what you actually hear next to the machine:
 *  - MIG (short-circuit transfer): "frying bacon" crackle from droplet short-circuits, bright hiss,
 *    and a buzz from the power source whose pitch rises with current.
 *  - TIG: a steady electrical buzz from the power source (strongest in AC mode), a faint inverter
 *    whine and soft gas flow. Its arc start is the high-frequency (HF) "zzzt" crackle.
 *  - Laser: the beam is silent; at most a muffled, low pulse thump and a dull gas whoosh.
 * Volume follows the simulator's smoothed arc level, so strikes and crater fades are heard too.
 */

type Proc = string;

const LASER_PULSE_HZ = 24;

class ArcAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;

  // MIG
  private migCrackle: GainNode | null = null;
  private migHiss: GainNode | null = null;
  private migHum: GainNode | null = null;
  private migHumOsc: OscillatorNode | null = null;

  // TIG
  private tigHum: GainNode | null = null;
  private tigWhine: GainNode | null = null;
  private tigWhineOsc: OscillatorNode | null = null;

  private tigBuzzOsc: OscillatorNode | null = null;

  // Laser
  private laserTicks: GainNode | null = null;
  private laserGas: GainNode | null = null;

  // Shared shielding-gas flow (soft low-passed noise)
  private gas: GainNode | null = null;

  // Bacon mode: a dense, greasy high sizzle layered on top
  private bacon: GainNode | null = null;

  private lastLevel = 0;
  private lastTarget = 0;
  /** 1 when the tab is focused, about 0.25 when the window is blurred, 0 when the tab is hidden. */
  private duck = 1;

  private applyDuck() {
    if (!this.ctx || !this.master) return;
    // Slow, gentle fade so leaving or returning to the tab never clicks
    this.master.gain.setTargetAtTime(this.lastTarget * this.duck, this.ctx.currentTime, 0.35);
  }

  private watchFocus() {
    const onChange = () => {
      this.duck = document.hidden ? 0 : document.hasFocus() ? 1 : 0.25;
      this.applyDuck();
    };
    document.addEventListener('visibilitychange', onChange);
    window.addEventListener('blur', onChange);
    window.addEventListener('focus', onChange);
    onChange();
  }

  private noiseBuffer(ctx: AudioContext, seconds: number, fill: (d: Float32Array, rate: number) => void) {
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
    fill(buf.getChannelData(0), ctx.sampleRate);
    return buf;
  }

  private loop(ctx: AudioContext, buf: AudioBuffer) {
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    src.start();
    return src;
  }

  private ensure(): boolean {
    if (this.ctx) return true;
    const Ctor: typeof AudioContext | undefined =
      typeof window !== 'undefined'
        ? window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        : undefined;
    if (!Ctor) return false;

    const ctx = new Ctor();
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    const gain = (v = 0) => {
      const g = ctx.createGain();
      g.gain.value = v;
      g.connect(master);
      return g;
    };
    const filter = (type: BiquadFilterType, hz: number, q = 0.7) => {
      const f = ctx.createBiquadFilter();
      f.type = type;
      f.frequency.value = hz;
      f.Q.value = q;
      return f;
    };

    // ---------- MIG ----------
    const crackleBuf = this.noiseBuffer(ctx, 2, (d) => {
      let env = 0;
      for (let i = 0; i < d.length; i++) {
        if (Math.random() < 0.0016) env = 0.6 + Math.random() * 0.4; // droplet short-circuit pop
        env *= 0.9965;
        d[i] = (Math.random() * 2 - 1) * env;
      }
    });
    this.migCrackle = gain();
    this.loop(ctx, crackleBuf).connect(filter('highpass', 900)).connect(this.migCrackle);

    const whiteBuf = this.noiseBuffer(ctx, 2, (d) => {
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    });
    this.migHiss = gain();
    this.loop(ctx, whiteBuf).connect(filter('bandpass', 3200)).connect(this.migHiss);

    this.migHumOsc = ctx.createOscillator();
    this.migHumOsc.type = 'sawtooth';
    this.migHumOsc.frequency.value = 110;
    this.migHum = gain();
    this.migHumOsc.connect(filter('lowpass', 380)).connect(this.migHum);
    this.migHumOsc.start();

    // ---------- TIG ----------
    // Buzz: a harmonically rich square wave with a detuned saw for slight beating, softened by a
    // low-pass, plus a gentle 7 Hz flutter so it rasps like a real power source instead of a test tone.
    this.tigBuzzOsc = ctx.createOscillator();
    this.tigBuzzOsc.type = 'triangle'; // warm fundamental; the detuned saw adds just enough edge
    this.tigBuzzOsc.frequency.value = 100;
    const buzzBeat = ctx.createOscillator();
    buzzBeat.type = 'sawtooth';
    buzzBeat.frequency.value = 201.5;
    const beatGain = ctx.createGain();
    beatGain.gain.value = 0.18;
    const buzzLp = filter('lowpass', 650);
    const flutter = ctx.createGain();
    flutter.gain.value = 0.85;
    const flutterLfo = ctx.createOscillator();
    flutterLfo.frequency.value = 7;
    const flutterDepth = ctx.createGain();
    flutterDepth.gain.value = 0.06;
    flutterLfo.connect(flutterDepth).connect(flutter.gain);
    this.tigHum = gain();
    this.tigBuzzOsc.connect(buzzLp);
    buzzBeat.connect(beatGain).connect(buzzLp);
    buzzLp.connect(flutter).connect(this.tigHum);
    this.tigBuzzOsc.start();
    buzzBeat.start();
    flutterLfo.start();

    this.tigWhineOsc = ctx.createOscillator();
    this.tigWhineOsc.type = 'sine';
    this.tigWhineOsc.frequency.value = 1900;
    const drift = ctx.createOscillator(); // slow pitch drift so the whine sounds alive, not like a test tone
    drift.frequency.value = 0.35;
    const driftDepth = ctx.createGain();
    driftDepth.gain.value = 18;
    drift.connect(driftDepth).connect(this.tigWhineOsc.frequency);
    drift.start();
    this.tigWhine = gain();
    this.tigWhineOsc.connect(this.tigWhine);
    this.tigWhineOsc.start();

    // ---------- Laser ----------
    const tickBuf = this.noiseBuffer(ctx, 1, (d, rate) => {
      const period = Math.floor(rate / LASER_PULSE_HZ);
      for (let i = 0; i < d.length; i++) {
        const k = i % period;
        const amp = Math.exp(-k / (rate * 0.0025)); // ~2.5 ms pulse crack
        d[i] = (Math.random() * 2 - 1) * amp * (0.75 + 0.25 * Math.sin(i / period));
      }
    });
    this.laserTicks = gain();
    // Muffled: only the low thump of each pulse gets through
    this.loop(ctx, tickBuf).connect(filter('lowpass', 420)).connect(this.laserTicks);

    // ---------- Shared shielding gas ----------
    const pinkBuf = this.noiseBuffer(ctx, 2, (d) => {
      // Paul Kellet's economy pink noise: softer and more "airy" than white noise
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < d.length; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.99765 * b0 + w * 0.099046;
        b1 = 0.963 * b1 + w * 0.2965164;
        b2 = 0.57 * b2 + w * 1.0526913;
        d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.12;
      }
    });
    this.gas = gain();
    this.loop(ctx, pinkBuf).connect(filter('lowpass', 1100)).connect(this.gas);
    // Laser: same gas, but dull and distant behind the enclosure
    this.laserGas = gain();
    this.loop(ctx, pinkBuf).connect(filter('lowpass', 360)).connect(this.laserGas);

    // ---------- Bacon (easter egg) ----------
    const sizzleBuf = this.noiseBuffer(ctx, 2, (d) => {
      let env = 0;
      for (let i = 0; i < d.length; i++) {
        if (Math.random() < 0.006) env = 0.4 + Math.random() * 0.6; // fat popping in the pan
        env *= 0.992;
        d[i] = (Math.random() * 2 - 1) * (0.25 + env);
      }
    });
    this.bacon = gain();
    this.loop(ctx, sizzleBuf).connect(filter('highpass', 2600)).connect(this.bacon);

    this.ctx = ctx;
    this.master = master;
    this.watchFocus();
    return true;
  }

  /** TIG high-frequency arc start: a short, sharp crackling burst. */
  private hfStart() {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const buf = this.noiseBuffer(ctx, 0.35, (d, rate) => {
      for (let i = 0; i < d.length; i++) {
        const t = i / rate;
        const sparkGate = Math.random() < 0.08 ? 1 : 0.15; // HF spark gap chatter
        d[i] = (Math.random() * 2 - 1) * sparkGate * Math.exp(-t / 0.12);
      }
    });
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 2500;
    const g = ctx.createGain();
    g.gain.value = 0.9;
    src.connect(hp).connect(g).connect(this.master);
    src.start();
  }

  /** Called once per frame by the simulator. level: 0..1 smoothed arc level. */
  update(level: number, process: Proc, currentAmps: number, enabled: boolean, bacon = false) {
    const target = enabled ? level : 0;
    if (target < 0.001 && !this.ctx) return; // never create audio just to stay silent
    if (!this.ensure() || !this.ctx || !this.master) return;
    if (this.ctx.state === 'suspended' && target > 0) void this.ctx.resume();

    const t = this.ctx.currentTime;
    const set = (g: GainNode | null, v: number) => g?.gain.setTargetAtTime(v, t, 0.05);
    const isTig = process === 'TIG';
    const isLaser = process === 'LASER';
    const isMig = !isTig && !isLaser;

    set(this.migCrackle, isMig ? 0.9 : 0);
    set(this.migHiss, isMig ? 0.22 : 0);
    set(this.migHum, isMig ? 0.2 : 0);
    this.migHumOsc?.frequency.setTargetAtTime(70 + currentAmps * 0.23, t, 0.1);

    set(this.tigHum, isTig ? 0.22 : 0);
    set(this.tigWhine, isTig ? 0.004 : 0);
    this.tigBuzzOsc?.frequency.setTargetAtTime(95 + currentAmps * 0.05, t, 0.2);
    // Inverter whine climbs slightly with current
    this.tigWhineOsc?.frequency.setTargetAtTime(1700 + currentAmps * 1.5, t, 0.2);

    set(this.laserTicks, isLaser ? 0.55 : 0);
    set(this.laserGas, isLaser ? 1.2 : 0);
    set(this.gas, isTig ? 0.35 : isMig ? 0.2 : 0);
    set(this.bacon, bacon ? 0.7 : 0);

    // Laser is near-silent, TIG a moderate buzz, MIG the loudest
    const loudness = isLaser ? 0.06 : isTig ? 0.08 : 0.16;
    this.lastTarget = loudness * target;
    this.master.gain.setTargetAtTime(this.lastTarget * this.duck, t, 0.03);

    if (enabled && isTig && this.lastLevel < 0.05 && level >= 0.05) this.hfStart();
    this.lastLevel = enabled ? level : 0;
  }

  /** Immediately fades out (simulation paused, reset or unmounted). */
  silence() {
    this.lastLevel = 0;
    this.lastTarget = 0;
    if (!this.ctx || !this.master) return;
    this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.02);
  }
}

export const arcAudio = new ArcAudio();
