// Fortschritt und Einstellungen im localStorage (nur auf diesem Gerät).
const KEY = 'quran-app-v1';
const DEFAULTS = { learned: {}, checks: {}, mistakes: {}, days: [], last: null, settings: { theme: 'auto', size: 1, repeat: 3, rate: 1, level: 0, hide: 0, modelConsent: false } };

let state;
function load() {
  try { state = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { state = { ...DEFAULTS }; }
  state.settings = { ...DEFAULTS.settings, ...state.settings };
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* Speicher gesperrt: App läuft ohne Speichern weiter */ } }
load();

export const settings = () => state.settings;
export function setSetting(k, v) { state.settings[k] = v; save(); }
export const isLearned = (s, v) => !!state.learned[`${s}:${v}`];
export function setLearned(s, v, on) { if (on) state.learned[`${s}:${v}`] = Date.now(); else delete state.learned[`${s}:${v}`]; save(); }
export const learnedCount = (s) => Object.keys(state.learned).filter((k) => k.startsWith(s + ':')).length;
export function saveCheck(s, v, score) { state.checks[`${s}:${v}`] = { score, at: Date.now() }; save(); }
export const lastCheck = (s, v) => state.checks[`${s}:${v}`];
export function resetAll() { state = JSON.parse(JSON.stringify({ ...DEFAULTS, settings: state.settings })); save(); }

// Fehler aus Rezitationsprüfungen (Wort-Ebene): Schlüssel "Sure:Vers:Wortindex"
export const mistakes = () => Object.values(state.mistakes).sort((a, b) => b.at - a.at);
export function addMistake(m) { state.mistakes[`${m.s}:${m.v}:${m.i}`] = { ...m, at: Date.now() }; save(); }
export function clearMistake(s, v, i) { if (state.mistakes[`${s}:${v}:${i}`]) { delete state.mistakes[`${s}:${v}:${i}`]; save(); } }

// Serie: Tage in Folge mit Aktivität (Hören oder Prüfen)
const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export function touchDay() { const k = dayKey(); if (!state.days.includes(k)) { state.days.push(k); state.days = state.days.slice(-400); save(); } }
export function streak() {
  const set = new Set(state.days); const d = new Date(); let n = 0;
  if (!set.has(dayKey(d))) d.setDate(d.getDate() - 1);
  while (set.has(dayKey(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
export const lastPos = () => state.last;
export function setLastPos(s, v) { state.last = { s, v }; save(); }
