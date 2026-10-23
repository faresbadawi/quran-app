// Vergleich der erkannten Rezitation mit dem erwarteten Vers, Wort für Wort.
// Verglichen wird nur das Konsonantengerüst (ohne Vokal- und Tadschwid-Zeichen), weil die Spracherkennung
// diese nicht zuverlässig liefert. Aussprache/Tadschwid wird damit NICHT geprüft.

export function normalizeWord(w) {
  return w.normalize('NFD')
    .replace(/[\u0670\u0671]/g, 'ا')      // Dolch-Alif (langes ā) und Wasla-Alif als Alif behandeln
    .replace(/[^\u0621-\u064A]/g, '')     // alles außer Grundbuchstaben (Vokal-, Pausen-, Satzzeichen) entfernen
    .replace(/[\u0623\u0625\u0622]/g, 'ا').replace(/\u0649/g, 'ي').replace(/\u0629/g, 'ه')
    .replace(/[\u0621\u0624\u0626]/g, '')    // Hamza-Schreibweisen unterscheiden sich je nach Quelle
    .replace(/(.)\1+/g, '$1')                // Dehnungen/Verdopplungen angleichen (ا + ا)
    .replace(/ا+/g, 'ا');
}

function lev(a, b) {
  const m = a.length, n = b.length;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}

export function similarity(a, b) {
  if (!a.length && !b.length) return 1;
  return 1 - lev(a, b) / Math.max(a.length, b.length);
}

// Liefert für jedes erwartete Wort: { status: 'ok' | 'close' | 'wrong' | 'missing', heard } sowie zusätzlich gehörte Wörter.
export function compareVerse(expectedWords, recognizedText, { open = false } = {}) {
  const exp = expectedWords.map(normalizeWord);
  const got = recognizedText.split(/\s+/).map((w) => ({ raw: w, n: normalizeWord(w) })).filter((w) => w.n);
  const OK = 0.8, CLOSE = 0.55;
  const m = exp.length, n = got.length;
  // Wortweise Ausrichtung (Needleman-Wunsch) mit Ähnlichkeit als Gewinn.
  const gap = -0.6;
  const score = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) score[i][0] = i * gap;
  for (let j = 1; j <= n; j++) score[0][j] = j * gap;
  const sub = (i, j) => { const s = similarity(exp[i], got[j].n); return s >= CLOSE ? s : -0.8; };
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
    score[i][j] = Math.max(score[i - 1][j - 1] + sub(i - 1, j - 1), score[i - 1][j] + gap, score[i][j - 1] + gap);
  }
  const words = new Array(m), extra = [];
  // open: Es wird nur bis dorthin bewertet, wo der Sprecher aufgehört hat (Rest = 'rest').
  let i = m, j = n;
  if (open) {
    let best = 0;
    for (let k = 1; k <= m; k++) if (score[k][n] > score[best][n] + 1e-9) best = k;
    for (let k = best; k < m; k++) words[k] = { status: 'rest', heard: '' };
    i = best;
  }
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && Math.abs(score[i][j] - (score[i - 1][j - 1] + sub(i - 1, j - 1))) < 1e-9) {
      const s = similarity(exp[i - 1], got[j - 1].n);
      words[i - 1] = s >= OK ? { status: 'ok', heard: got[j - 1].raw }
        : s >= CLOSE ? { status: 'close', heard: got[j - 1].raw } : { status: 'wrong', heard: got[j - 1].raw };
      i--; j--;
    } else if (i > 0 && Math.abs(score[i][j] - (score[i - 1][j] + gap)) < 1e-9) {
      words[i - 1] = { status: 'missing', heard: '' }; i--;
    } else { extra.unshift(got[j - 1].raw); j--; }
  }
  const judged = words.filter((w) => w.status !== 'rest').length;
  const ok = words.filter((w) => w.status === 'ok').length;
  return { words, extra, ok, total: judged, score: judged ? ok / judged : 0 };
}
