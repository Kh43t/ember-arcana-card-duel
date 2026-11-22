// audio.js — all sound is procedural WebAudio: no audio files, no network.
// A tiny synth (oscillator + gain envelope) plus a gentle music loop built from
// a minor-pentatonic arpeggio. Created lazily on first user gesture so browsers
// allow it; M toggles mute.

const MUSIC_NOTES = [220.0, 261.63, 329.63, 392.0, 440.0, 523.25, 392.0, 329.63];
const MUSIC_STEP_MS = 340;

export class SoundBank {
  constructor() {
    this.context = null;
    this.master = null;
    this.muted = false;
    this.musicTimer = null;
    this.musicStep = 0;
  }

  ensure() {
    if (this.context) {
      if (this.context.state === 'suspended') void this.context.resume();
      return true;
    }
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return false;
    this.context = new Ctor();
    this.master = this.context.createGain();
    this.master.gain.value = this.muted ? 0 : 0.5;
    this.master.connect(this.context.destination);
    return true;
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : 0.5;
  }

  tone(freq, durMs, type = 'sine', volume = 0.2, delayMs = 0, slideTo = null) {
    if (!this.ensure() || this.muted) return;
    const t0 = this.context.currentTime + delayMs / 1000;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + durMs / 1000);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + durMs / 1000);
    osc.connect(gain).connect(this.master);
    osc.start(t0);
    osc.stop(t0 + durMs / 1000 + 0.05);
  }

  click() { this.tone(660, 60, 'triangle', 0.12); }
  deal() { this.tone(520, 70, 'triangle', 0.14); this.tone(780, 70, 'triangle', 0.1, 70); }
  playCard() { this.tone(440, 90, 'square', 0.08); this.tone(660, 120, 'triangle', 0.14, 60); }
  resonance() { this.tone(880, 90, 'sine', 0.16); this.tone(1174, 140, 'sine', 0.16, 80); }
  damage() { this.tone(160, 180, 'sawtooth', 0.2, 0, 70); this.tone(90, 220, 'triangle', 0.22, 20, 45); }
  heal() { this.tone(523, 120, 'sine', 0.14); this.tone(659, 120, 'sine', 0.14, 90); this.tone(784, 180, 'sine', 0.14, 180); }
  shield() { this.tone(392, 140, 'triangle', 0.14); this.tone(587, 160, 'triangle', 0.12, 70); }
  draw() { this.tone(700, 50, 'sine', 0.1); }
  turn() { this.tone(330, 80, 'triangle', 0.12); this.tone(495, 100, 'triangle', 0.12, 80); }
  denied() { this.tone(180, 120, 'square', 0.1, 0, 120); }

  winFanfare() {
    [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 260, 'triangle', 0.18, i * 130));
    this.tone(1318, 500, 'sine', 0.16, 560);
  }

  loseDescent() {
    [392, 330, 262, 196].forEach((f, i) => this.tone(f, 280, 'triangle', 0.16, i * 150));
  }

  startMusic() {
    if (!this.ensure() || this.musicTimer) return;
    this.musicTimer = window.setInterval(() => {
      if (this.muted) return;
      const note = MUSIC_NOTES[this.musicStep % MUSIC_NOTES.length];
      this.tone(note, 300, 'sine', 0.045);
      if (this.musicStep % 4 === 2) this.tone(note / 2, 320, 'sine', 0.035);
      this.musicStep++;
    }, MUSIC_STEP_MS);
  }

  stopMusic() {
    if (this.musicTimer) window.clearInterval(this.musicTimer);
    this.musicTimer = null;
  }
}
