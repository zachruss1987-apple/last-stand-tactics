// Procedural audio via the Web Audio API — owned by the Music Designer. Zero-dependency,
// no bundled files, no licensing questions (see docs/decisions.md Q4). Tense, sparse mood
// with crisp combat feedback. Audio is created on first user gesture (browser autoplay
// rules) and is fully mutable.

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.droneGain = null;
  }

  // Must be called from a user gesture (click) the first time.
  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.5;
    this.master.connect(this.ctx.destination);
    this._startDrone();
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master) {
      this.master.gain.setTargetAtTime(muted ? 0 : 0.5, this.ctx.currentTime, 0.02);
    }
  }

  _startDrone() {
    // Low, sparse two-oscillator drone for apocalyptic ambience.
    const g = this.ctx.createGain();
    g.gain.value = 0.05;
    g.connect(this.master);
    this.droneGain = g;
    [55, 82.5].forEach((f, i) => {
      const o = this.ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      const lfo = this.ctx.createOscillator();
      lfo.frequency.value = 0.05 + i * 0.03;
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 2;
      lfo.connect(lfoGain).connect(o.frequency);
      o.connect(g);
      o.start();
      lfo.start();
    });
  }

  _tone(freq, dur, type = 'sine', gain = 0.3, slideTo = null) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  _noise(dur, gain = 0.4, hp = 800) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const frames = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, frames, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = hp;
    const g = this.ctx.createGain();
    g.gain.value = gain;
    src.connect(filter).connect(g).connect(this.master);
    src.start(t);
  }

  // Event -> intended feeling map (Music Designer's sound design).
  play(event) {
    if (!this.ctx) return;
    switch (event) {
      case 'select':  this._tone(660, 0.08, 'triangle', 0.2); break;
      case 'move':    this._tone(320, 0.07, 'sine', 0.15); break;
      case 'hit':     this._noise(0.18, 0.5, 600); this._tone(140, 0.12, 'square', 0.25, 70); break;
      case 'counter': this._noise(0.14, 0.35, 900); break;
      case 'heal':    this._tone(520, 0.12, 'sine', 0.2, 780); break;
      case 'down':    this._tone(200, 0.4, 'sawtooth', 0.3, 60); this._noise(0.3, 0.3, 300); break;
      case 'phase':   this._tone(110, 0.5, 'sine', 0.25, 90); break;
      case 'victory': [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this._tone(f, 0.25, 'triangle', 0.3), i * 140)); break;
      case 'defeat':  [330, 262, 196, 131].forEach((f, i) => setTimeout(() => this._tone(f, 0.4, 'sawtooth', 0.3), i * 200)); break;
      default: break;
    }
  }
}
