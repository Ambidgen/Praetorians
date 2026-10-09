// Sound effects synthesised with WebAudio. No audio files, so nothing extra to download.
// The AudioContext is created lazily on the first sound, which browsers only allow after a user gesture.

let ctx = null;
let enabled = true;

export function setSoundEnabled(on) {
  enabled = Boolean(on);
}

export function isSoundEnabled() {
  return enabled;
}

function context() {
  if (!enabled) return null;
  if (!ctx) {
    const Ctor = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// One oscillator blip with a short exponential decay and an optional pitch slide.
function tone(freq, { dur = 0.12, type = 'square', vol = 0.05, slideTo = null, delay = 0 } = {}) {
  const c = context();
  if (!c) return;
  const t = c.currentTime + delay;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

export const sfx = {
  click() {
    tone(520, { dur: 0.06, vol: 0.04 });
  },
  flip() {
    tone(880, { dur: 0.05, vol: 0.03, slideTo: 1320 });
  },
  good() {
    tone(660, { dur: 0.1, vol: 0.05 });
    tone(990, { dur: 0.14, vol: 0.05, delay: 0.08 });
  },
  bad() {
    tone(220, { dur: 0.25, type: 'sawtooth', vol: 0.06, slideTo: 110 });
  },
  gamble() {
    tone(440, { dur: 0.08, type: 'triangle', vol: 0.06 });
    tone(330, { dur: 0.08, type: 'triangle', vol: 0.06, delay: 0.09 });
  },
  doom() {
    tone(180, { dur: 0.6, type: 'sawtooth', vol: 0.07, slideTo: 40 });
  },
};
