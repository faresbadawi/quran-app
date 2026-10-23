// Sprachen: Deutsch ist vorhanden; weitere Sprachen (en, ar mit RTL) als js/lang/<code>.js ergänzen und in LANGS eintragen.
import de from './lang/de.js';

const LANGS = { de };
let current = 'de';

export function setLang(code) {
  current = LANGS[code] ? code : 'de';
  document.documentElement.lang = current;
  document.documentElement.dir = LANGS[current].dir;
}

export function t(key, vars = {}) {
  const s = LANGS[current][key] ?? LANGS.de[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}
