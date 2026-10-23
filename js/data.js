// Lädt den (unveränderten) Koran-Text aus data/quran.json.
let cache;
export async function loadQuran() {
  if (!cache) cache = fetch('data/quran.json').then((r) => { if (!r.ok) throw new Error('Text nicht ladbar'); return r.json(); });
  return cache;
}
export const audioUrl = (s, v) => `audio/alafasy64/${String(s).padStart(3, '0')}${String(v).padStart(3, '0')}.mp3`;
