// Auswendig-Modus: Welche Wörter eines Verses ausgeblendet sind, ist je Stufe fest (nicht zufällig pro Aufruf).
// Stufe 0 = alles sichtbar, 1 ≈ ein Drittel, 2 ≈ zwei Drittel, 3 = alles verdeckt.
const FRACTION = [0, 1 / 3, 2 / 3, 1];

function hash(s, v, i) {
  let h = 2166136261 ^ (s * 1000 + v);
  h = Math.imul(h ^ (i + 1), 16777619);
  h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15;
  return h >>> 0;
}

export function hiddenIndexes(s, v, wordCount, level) {
  const count = Math.round(wordCount * FRACTION[level]);
  const ranked = Array.from({ length: wordCount }, (_, i) => i).sort((a, b) => hash(s, v, a) - hash(s, v, b));
  return new Set(ranked.slice(0, count));
}
