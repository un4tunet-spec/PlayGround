// Procedural WebAudio SFX — no assets needed.
let ctx = null;
let muted = false;

function ac() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur = 0.12, type = 'sine', gain = 0.18, slideTo = null, delay = 0) {
  if (muted) return;
  try {
    const c = ac();
    const t = c.currentTime + delay;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + dur + 0.05);
  } catch { /* audio unavailable */ }
}

function noise(dur = 0.15, gain = 0.2, delay = 0) {
  if (muted) return;
  try {
    const c = ac();
    const t = c.currentTime + delay;
    const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const s = c.createBufferSource();
    s.buffer = buf;
    const g = c.createGain();
    g.gain.value = gain;
    const f = c.createBiquadFilter();
    f.type = 'highpass'; f.frequency.value = 1200;
    s.connect(f).connect(g).connect(c.destination);
    s.start(t);
  } catch { /* noop */ }
}

export const sfx = {
  get muted() { return muted; },
  toggle() { muted = !muted; return muted; },
  click() { tone(700, 0.06, 'square', 0.08); },
  hover() { tone(980, 0.03, 'sine', 0.03); },
  ratchet() { noise(0.09, 0.22); tone(220, 0.07, 'square', 0.1, 160); },
  boltOut() { tone(520, 0.1, 'square', 0.12, 880); noise(0.08, 0.14); },
  extract() { tone(180, 0.35, 'sawtooth', 0.12, 420); tone(420, 0.3, 'sine', 0.1, 840, 0.08); },
  error() { tone(160, 0.25, 'sawtooth', 0.16, 90); },
  locked() { tone(240, 0.12, 'square', 0.1, 200); tone(200, 0.12, 'square', 0.1, 170, 0.12); },
  hint() { tone(660, 0.12, 'sine', 0.12, 990); tone(990, 0.15, 'sine', 0.1, 1320, 0.1); },
  win() {
    [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.16, null, i * 0.14));
    noise(0.5, 0.05, 0.2);
  },
  select() { tone(440, 0.07, 'triangle', 0.1, 660); }
};
