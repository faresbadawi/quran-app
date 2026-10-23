// Holt den uthmanischen Koran-Text (Tanzil-Text über alquran.cloud) für die Suren 78-80,
// prüft ihn gegen eine zweite Quelle (Quran.com API v4) und schreibt data/quran.json.
// Aufruf:  node tools/fetch-text.mjs
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';

const SURAHS = [
  { n: 78, verses: 40, ar: 'النبأ', translit: "An-Naba'", de: 'Die Nachricht' },
  { n: 79, verses: 46, ar: 'النازعات', translit: "An-Nazi'at", de: 'Die Entreißenden' },
  { n: 80, verses: 42, ar: 'عبس', translit: "'Abasa", de: 'Er runzelte die Stirn' },
];
const BASMALA = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';

// Nur zum Vergleich der beiden Quellen: Vokalzeichen, Tatwil und Zeichenkonventionen angleichen.
const norm = (t) => [...t.normalize('NFD')].filter((c) => !/\p{M}/u.test(c) && c !== 'ـ')
  .join('').replace(/ء/g, '').replace(/[ٱأإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/\s+/g, ' ').trim();

// Eigenständige Pausenzeichen (z. B. ۖ ۚ ۗ ۛ ۘ ۙ ۚ) gehören zum vorherigen Wort und zählen nicht als Wort.
const isMark = (tok) => [...tok].every((c) => c >= 'ۖ' && c <= 'ۜ');

async function getJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} -> ${r.status}`);
  return r.json();
}

const out = { source: {
  text: 'Tanzil Quran Text (Uthmani, v1.1) über api.alquran.cloud, Edition quran-uthmani',
  url: 'https://tanzil.net/docs/quran_text_license',
  crossCheck: 'Quran.com API v4 (text_uthmani, normalisierter Vergleich)',
  fetched: new Date().toISOString().slice(0, 10),
}, basmala: BASMALA, surahs: [] };

for (const s of SURAHS) {
  const a = (await getJson(`https://api.alquran.cloud/v1/surah/${s.n}/quran-uthmani`)).data;
  const q = (await getJson(`https://api.quran.com/api/v4/verses/by_chapter/${s.n}?words=true&word_fields=text_uthmani&per_page=50`)).verses;
  if (a.numberOfAyahs !== s.verses || a.ayahs.length !== s.verses || q.length !== s.verses) {
    throw new Error(`Sure ${s.n}: Versanzahl stimmt nicht (${a.ayahs.length}/${q.length}, erwartet ${s.verses})`);
  }
  const verses = a.ayahs.map((v, i) => {
    if (v.numberInSurah !== i + 1) throw new Error(`Sure ${s.n}: Reihenfolge bei Vers ${i + 1}`);
    let text = v.text;
    if (i === 0) {
      // Die API setzt die Basmala vor Vers 1: die ersten 4 Wörter abtrennen (nach Prüfung, dass es die Basmala ist).
      const t = text.split(/\s+/);
      if (norm(t.slice(0, 4).join(' ')) !== norm(BASMALA)) throw new Error(`Sure ${s.n}: Basmala am Anfang nicht gefunden`);
      text = t.slice(4).join(' ');
    }
    const words = [];
    for (const tok of text.split(/\s+/).filter(Boolean)) {
      if (isMark(tok) && words.length) words[words.length - 1] += ' ' + tok;
      else words.push(tok);
    }
    const other = q[i].words.filter((w) => w.char_type_name === 'word').map((w) => w.text_uthmani).join(' ');
    if (norm(text) !== norm(other)) throw new Error(`Sure ${s.n} Vers ${i + 1}: Quellen weichen ab\n${text}\n${other}`);
    return { n: i + 1, text, words };
  });
  out.surahs.push({ number: s.n, name: s.ar, translit: s.translit, de: s.de, verses });
  console.log(`Sure ${s.n}: ${verses.length} Verse, ${verses.reduce((n, v) => n + v.words.length, 0)} Wörter – beide Quellen stimmen überein`);
}

out.sha256 = crypto.createHash('sha256').update(JSON.stringify(out.surahs)).digest('hex');
fs.writeFileSync(path.resolve(import.meta.dirname, '../data/quran.json'), JSON.stringify(out));
console.log('data/quran.json geschrieben, SHA-256 der Suren:', out.sha256);
