// Fortschritt und Einstellungen im localStorage (nur auf diesem Gerät).
const KEY = 'quran-app-v1';
const DEFAULTS = { learned: {}, checks: {}, settings: { theme: 'auto', size: 1, repeat: 3, rate: 1, level: 0, modelConsent: false } };

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
