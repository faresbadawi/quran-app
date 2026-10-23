// Audio-Wiedergabe einzelner Verse oder einer ganzen Sure, mit Wiederholung und Tempo.
import { audioUrl } from './data.js';

const audio = new Audio();
audio.preload = 'auto';
let token = 0;
const listeners = new Set();
let now = null; // { s, v, rep, reps }

export const onPlayback = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
const emit = () => listeners.forEach((fn) => fn(now));
export const current = () => now;

export function stop() {
  token++;
  audio.pause();
  now = null;
  emit();
}

function playOnce(url, rate, my) {
  return new Promise((resolve) => {
    audio.src = url;
    audio.playbackRate = rate;
    audio.defaultPlaybackRate = rate;
    const done = (ok) => { audio.onended = audio.onerror = null; resolve(ok && my === token); };
    audio.onended = () => done(true);
    audio.onerror = () => done(false);
    audio.play().catch(() => done(false));
  });
}

// items: [{ s, v }], jeder Eintrag wird `repeat`-mal gespielt.
export async function play(items, { repeat = 1, rate = 1 } = {}) {
  const my = ++token;
  audio.pause();
  for (const it of items) {
    for (let rep = 1; rep <= repeat; rep++) {
      if (my !== token) return;
      now = { ...it, rep, reps: repeat };
      emit();
      const ok = await playOnce(audioUrl(it.s, it.v), rate, my);
      if (!ok) { if (my === token) { now = null; emit(); } return; }
      if (rep < repeat) await new Promise((r) => setTimeout(r, 350));
    }
  }
  if (my === token) { now = null; emit(); }
}
