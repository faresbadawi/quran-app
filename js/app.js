import { t, setLang } from './i18n.js';
import { loadQuran } from './data.js';
import { settings, setSetting, isLearned, setLearned, learnedCount, saveCheck, lastCheck, resetAll } from './store.js';
import * as player from './player.js';
import { hiddenIndexes } from './hide.js';
import { compareVerse } from './compare.js';
import { Recorder, loadModel, transcribe, decodeTo16k, modelReady } from './recite.js';

setLang('de');
const $ = (sel, root = document) => root.querySelector(sel);
const main = $('#main');
const sheetRoot = $('#sheet-root');
let quran;

function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (v === true) el.setAttribute(k, '');
    else if (v !== false && v != null) el.setAttribute(k, v);
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid);
  return el;
}

function toast(msg) {
  const el = $('#toast'); el.textContent = msg; el.hidden = false;
  clearTimeout(toast.t); toast.t = setTimeout(() => { el.hidden = true; }, 2600);
}

// ---------- Darstellung ----------
function applyAppearance() {
  const s = settings();
  document.documentElement.dataset.theme = s.theme === 'auto' ? '' : s.theme;
  document.documentElement.style.setProperty('--ar-scale', s.size);
  const dark = s.theme === 'dark' || (s.theme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  $('meta[name=theme-color]').content = dark ? '#12201c' : '#1f6f5c';
}
applyAppearance();
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', applyAppearance);

const icon = (d) => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true'); s.innerHTML = d; return s; };
const ICON = {
  play: '<path d="M8 5v14l11-7z" fill="currentColor"/>',
  pause: '<path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor"/>',
  back: '<path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
  close: '<path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor"/><path d="M5 11a7 7 0 0014 0M12 18v3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>',
  chev: '<path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
  gear: '<circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
};
const btn = (cls, ic, label, onclick, extra = {}) => h('button', { class: cls, type: 'button', 'aria-label': label, title: label, onclick, ...extra }, icon(ICON[ic]));

// ---------- Wörter mit Ausblenden ----------
function verseText(surah, verse, level) {
  const hidden = hiddenIndexes(surah.number, verse.n, verse.words.length, level);
  return h('p', { class: 'ayah', lang: 'ar', dir: 'rtl' }, verse.words.map((w, i) => {
    if (!hidden.has(i)) return h('span', { class: 'w' }, w, ' ');
    const el = h('button', { type: 'button', class: 'w hid', 'aria-label': '•', style: `--len:${Math.max(2, [...w.replace(/[ً-ٰٟۖ-ۭ]/g, '')].length)}` });
    el.addEventListener('click', () => { const s = h('span', { class: 'w shown' }, w, ' '); el.replaceWith(s); });
    return el;
  }));
}

function levelChips(current, onPick) {
  return h('div', { class: 'chips', role: 'group', 'aria-label': t('hideLevel') },
    [0, 1, 2, 3].map((l) => h('button', { type: 'button', class: 'chip' + (l === current ? ' on' : ''), 'aria-pressed': String(l === current), onclick: () => onPick(l) }, t('level' + l))));
}

// ---------- Startseite ----------
function homeView() {
  main.replaceChildren(
    h('header', { class: 'top home' },
      h('div', {}, h('h1', {}, t('appTitle')), h('p', { class: 'sub' }, t('appSub'))),
      btn('icon-btn', 'gear', t('aboutLink'), () => { location.hash = '#/about'; })),
    h('section', { class: 'list' }, quran.surahs.map((s) => {
      const done = learnedCount(s.number), total = s.verses.length;
      return h('a', { class: 'card surah', href: `#/s/${s.number}` },
        h('span', { class: 'num' }, String(s.number)),
        h('span', { class: 'meta' },
          h('b', {}, `${s.translit}`), h('span', {}, `${s.de} · ${t('verses', { n: total })}`),
          h('span', { class: 'bar', role: 'progressbar', 'aria-valuenow': done, 'aria-valuemax': total, 'aria-label': t('memorized', { n: done, total }) }, h('i', { style: `width:${(done / total) * 100}%` })),
          h('small', {}, t('memorized', { n: done, total }))),
        h('span', { class: 'ar-name', lang: 'ar', dir: 'rtl' }, s.name),
        icon(ICON.chev));
    })),
    h('p', { class: 'foot' }, t('sourceText'), ' ', h('a', { href: '#/about' }, t('aboutLink'))));
  window.scrollTo(0, 0);
}

// ---------- Sure ----------
let level = settings().level;
function surahView(num, openVerse) {
  const surah = quran.surahs.find((s) => s.number === num);
  if (!surah) { location.hash = '#/'; return; }
  const cards = new Map();
  const playAllBtn = h('button', { class: 'btn primary', type: 'button' });
  const refreshPlayAll = () => {
    const c = player.current(), on = !!c && c.all === surah.number;
    playAllBtn.replaceChildren(icon(ICON[on ? 'stop' : 'play']), on ? t('stop') : t('listenAll'));
  };
  playAllBtn.onclick = () => {
    if (playAllBtn.dataset.on === '1') { player.stop(); return; }
    player.play(surah.verses.map((v) => ({ s: surah.number, v: v.n, all: surah.number })), { repeat: 1, rate: settings().rate });
  };
  const chips = h('div', { class: 'levelbar' }, h('span', { class: 'lbl' }, t('hideLevel')));
  const renderChips = () => chips.replaceChildren(h('span', { class: 'lbl' }, t('hideLevel')), levelChips(level, (l) => { level = l; setSetting('level', l); renderChips(); renderVerses(); }));
  const versesEl = h('section', { class: 'verses' });

  function renderVerses() {
    cards.clear();
    versesEl.replaceChildren(...surah.verses.map((v) => {
      const learned = isLearned(surah.number, v.n);
      const card = h('article', { class: 'verse' + (learned ? ' learned' : ''), id: `v${v.n}` },
        h('div', { class: 'vhead' },
          h('span', { class: 'vnum' }, String(v.n)),
          learned ? h('span', { class: 'tag' }, icon(ICON.check), t('learned')) : null,
          h('span', { class: 'grow' }),
          btn('icon-btn sm', 'play', t('play'), () => player.play([{ s: surah.number, v: v.n }], { repeat: 1, rate: settings().rate })),
          h('button', { class: 'btn small', type: 'button', onclick: () => { location.hash = `#/s/${surah.number}/${v.n}`; } }, t('check'))),
        verseText(surah, v, level));
      cards.set(v.n, card);
      return card;
    }));
    markPlaying(player.current());
  }
  function markPlaying(c) {
    cards.forEach((el, n) => el.classList.toggle('playing', !!c && c.s === surah.number && c.v === n));
    playAllBtn.dataset.on = c && c.all === surah.number ? '1' : '';
    refreshPlayAll();
    if (c && c.all === surah.number && c.rep === 1) cards.get(c.v)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
  surahView.unsub?.();
  surahView.unsub = player.onPlayback(markPlaying);

  main.replaceChildren(
    h('header', { class: 'top' },
      h('a', { class: 'icon-btn', href: '#/', 'aria-label': t('back') }, icon(ICON.back)),
      h('div', { class: 'grow' }, h('h1', {}, surah.translit), h('p', { class: 'sub' }, `${surah.de} · ${t('verses', { n: surah.verses.length })}`)),
      h('span', { class: 'ar-name big', lang: 'ar', dir: 'rtl' }, surah.name)),
    h('div', { class: 'tools' }, playAllBtn, chips),
    h('p', { class: 'hint' }, t('levelHint')),
    h('p', { class: 'basmala', lang: 'ar', dir: 'rtl' }, quran.basmala),
    versesEl);
  renderChips(); renderVerses(); refreshPlayAll();
  if (openVerse) sheetView(surah, openVerse); else { closeSheet(); window.scrollTo(0, 0); }
}

// ---------- Vers-Fenster (Hören, Lernen, Prüfen) ----------
let sheetCleanup = null;
function closeSheet() { sheetCleanup?.(); sheetCleanup = null; sheetRoot.replaceChildren(); document.body.classList.remove('sheet-open'); }

function sheetView(surah, n) {
  closeSheet();
  const verse = surah.verses[n - 1];
  if (!verse) { location.hash = `#/s/${surah.number}`; return; }
  document.body.classList.add('sheet-open');
  let lvl = level;
  const s = settings();
  const textBox = h('div', { class: 'big' });
  const renderText = () => textBox.replaceChildren(verseText(surah, verse, lvl));
  const playBtn = h('button', { class: 'btn primary wide', type: 'button' });
  const refreshPlay = (c) => {
    const on = !!c && c.s === surah.number && c.v === n;
    playBtn.replaceChildren(icon(ICON[on ? 'pause' : 'play']), on ? `${t('pause')}${c.reps > 1 ? ` (${c.rep}/${c.reps})` : ''}` : t('play'));
    playBtn.dataset.on = on ? '1' : '';
  };
  const play = () => player.play([{ s: surah.number, v: n }], { repeat: settings().repeat, rate: settings().rate });
  playBtn.onclick = () => (playBtn.dataset.on === '1' ? player.stop() : play());
  const unsub = player.onPlayback(refreshPlay); refreshPlay(player.current());

  const seg = (label, values, key, fmt) => {
    const box = h('div', { class: 'seg' });
    const render = () => box.replaceChildren(h('span', { class: 'lbl' }, label), h('div', { class: 'chips' }, values.map((x) =>
      h('button', { type: 'button', class: 'chip' + (settings()[key] === x ? ' on' : ''), onclick: () => { setSetting(key, x); render(); } }, fmt(x)))));
    render(); return box;
  };

  const learnedBtn = h('button', { class: 'btn', type: 'button' });
  const refreshLearned = () => {
    const on = isLearned(surah.number, n);
    learnedBtn.className = 'btn' + (on ? ' on' : '');
    learnedBtn.replaceChildren(icon(ICON.check), on ? t('learned') : t('markLearned'));
  };
  learnedBtn.onclick = () => { setLearned(surah.number, n, !isLearned(surah.number, n)); refreshLearned(); };
  refreshLearned();

  const checkBox = h('div', { class: 'check' });
  const reciter = reciteUI(surah, verse, checkBox);

  const nav = (d) => { player.stop(); location.hash = `#/s/${surah.number}/${n + d}`; };
  const sheet = h('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('verse', { n }) },
    h('div', { class: 'sheet-bar' },
      btn('icon-btn', 'close', t('close'), () => { player.stop(); location.hash = `#/s/${surah.number}`; }),
      h('b', {}, `${surah.translit} · ${t('verse', { n })}`),
      h('span', { class: 'grow' })),
    h('div', { class: 'sheet-body' },
      textBox,
      h('div', { class: 'levelbar' }, h('span', { class: 'lbl' }, t('hideLevel')), levelChips(lvl, (l) => { lvl = l; renderText(); sheetBody.querySelectorAll('.levelbar .chip').forEach((c, i) => { c.classList.toggle('on', i === l); c.setAttribute('aria-pressed', String(i === l)); }); })),
      playBtn,
      seg(t('repeat'), [1, 3, 5, 10], 'repeat', (x) => t('times', { n: x })),
      seg(t('speed'), [0.75, 1], 'rate', (x) => `${x}×`),
      learnedBtn,
      checkBox,
      h('div', { class: 'pager' },
        h('button', { class: 'btn', type: 'button', disabled: n <= 1, onclick: () => nav(-1) }, icon(ICON.back), t('prev')),
        h('button', { class: 'btn', type: 'button', disabled: n >= surah.verses.length, onclick: () => nav(1) }, t('next'), icon(ICON.chev)))));
  const sheetBody = sheet;
  renderText();
  sheetRoot.replaceChildren(h('div', { class: 'scrim', onclick: () => { player.stop(); location.hash = `#/s/${surah.number}`; } }), sheet);
  sheet.querySelector('.sheet-body').scrollTop = 0;
  sheetCleanup = () => { unsub(); reciter.dispose(); };
}

// ---------- Rezitationsprüfung ----------
function reciteUI(surah, verse, box) {
  let rec = null, disposed = false;
  const status = h('p', { class: 'status' });
  const area = h('div', { class: 'result' });
  const mainBtn = h('button', { class: 'btn accent wide', type: 'button' });
  box.replaceChildren(h('h3', {}, t('check')), mainBtn, status, area, h('p', { class: 'honest' }, t('honest')));

  const setBtn = (ic, label, fn, disabled = false) => { mainBtn.replaceChildren(icon(ICON[ic]), label); mainBtn.onclick = fn; mainBtn.disabled = disabled; };
  const idle = () => setBtn('mic', t('record'), start);

  async function ensureModel() {
    if (modelReady()) return true;
    if (!settings().modelConsent) {
      status.textContent = t('modelNeeded');
      setBtn('check', t('modelLoad'), () => { setSetting('modelConsent', true); status.textContent = ''; start(); });
      return false;
    }
    mainBtn.disabled = true;
    status.textContent = t('modelLoading', { p: 0 });
    try { await loadModel((p) => { if (!disposed) status.textContent = t('modelLoading', { p }); }); }
    catch (e) { status.textContent = t('error', { msg: e.message }); setSetting('modelConsent', false); idle(); return false; }
    status.textContent = '';
    return true;
  }

  async function start() {
    area.replaceChildren();
    if (!(await ensureModel()) || disposed) return;
    player.stop();
    rec = new Recorder();
    try { await rec.start(); }
    catch (e) { status.textContent = e.message === 'missing' ? t('micMissing') : t('micDenied'); idle(); return; }
    status.textContent = t('recording');
    box.classList.add('rec');
    setBtn('stop', t('recordStop'), finish);
  }

  async function finish() {
    const r = rec; rec = null;
    box.classList.remove('rec');
    setBtn('mic', t('processing'), null, true);
    status.textContent = t('processing');
    try {
      const { blob, ms } = await r.stop();
      if (ms < 800) { status.textContent = t('tooShort'); idle(); return; }
      const text = await transcribe(await decodeTo16k(blob));
      if (disposed) return;
      status.textContent = '';
      showResult(text);
    } catch (e) { status.textContent = t('error', { msg: e.message }); }
    idle();
    mainBtn.replaceChildren(icon(ICON.mic), t('again'));
  }

  function showResult(heard) {
    const res = compareVerse(verse.words, heard);
    saveCheck(surah.number, verse.n, res.score);
    const words = h('p', { class: 'ayah marks', lang: 'ar', dir: 'rtl' }, verse.words.map((w, i) => {
      const r = res.words[i];
      return h('span', { class: 'w m-' + r.status, title: r.heard || undefined }, w, ' ');
    }));
    area.replaceChildren(
      h('p', { class: 'score' }, t('resultScore', { ok: res.ok, total: res.total })),
      words,
      h('ul', { class: 'legend' }, ['ok', 'close', 'wrong', 'missing'].map((k) => h('li', { class: 'm-' + k }, t('legend' + k[0].toUpperCase() + k.slice(1))))),
      h('p', { class: 'heard' }, h('b', {}, t('heardLabel') + ': '), h('span', { lang: 'ar', dir: 'rtl' }, heard || '—')),
      res.extra.length ? h('p', { class: 'heard' }, h('b', {}, t('extraWords') + ': '), h('span', { lang: 'ar', dir: 'rtl' }, res.extra.join(' '))) : null);
  }

  idle();
  return { dispose() { disposed = true; rec?.cancel(); } };
}

// ---------- Über / Einstellungen ----------
function aboutView() {
  const s = settings();
  const opt = (key, val, label) => h('button', { type: 'button', class: 'chip' + (s[key] === val ? ' on' : ''), onclick: () => { setSetting(key, val); applyAppearance(); aboutView(); } }, label);
  main.replaceChildren(
    h('header', { class: 'top' },
      h('a', { class: 'icon-btn', href: '#/', 'aria-label': t('back') }, icon(ICON.back)),
      h('div', { class: 'grow' }, h('h1', {}, t('aboutLink')))),
    h('section', { class: 'prose' },
      h('h3', {}, t('theme')), h('div', { class: 'chips' }, opt('theme', 'auto', t('themeAuto')), opt('theme', 'light', t('themeLight')), opt('theme', 'dark', t('themeDark'))),
      h('h3', {}, t('textSize')), h('div', { class: 'chips' }, opt('size', 0.9, 'A−'), opt('size', 1, 'A'), opt('size', 1.2, 'A+'), opt('size', 1.4, 'A++')),
      h('h3', {}, t('source')),
      h('p', {}, 'Text: Tanzil Quran Text (Uthmani), unverändert, Quelle tanzil.net (Lizenz: tanzil.net/docs/quran_text_license), abgerufen über api.alquran.cloud und gegen Quran.com geprüft.'),
      h('p', {}, 'Audio: Mishary Alafasy (64 kbps) von EveryAyah.com, unverändert, nicht-kommerziell.'),
      h('p', {}, 'Schrift: Amiri Quran (SIL Open Font License).'),
      h('p', {}, 'Spracherkennung: Tarteel whisper-base-ar-quran (Apache-2.0), als ONNX-Konvertierung „iqbalaesthetic/Basira“, läuft lokal im Browser.'),
      h('p', { class: 'honest' }, t('honest')),
      h('button', { class: 'btn danger', type: 'button', onclick: () => { if (confirm(t('confirmReset'))) { resetAll(); aboutView(); } } }, t('resetProgress'))));
  window.scrollTo(0, 0);
}

// ---------- Routing ----------
function route() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (parts[0] === 's' && parts[1]) {
    const n = +parts[1], v = parts[2] ? +parts[2] : 0;
    if (!main.dataset.surah || +main.dataset.surah !== n) { main.dataset.surah = n; surahView(n, v); }
    else { const surah = quran.surahs.find((x) => x.number === n); v ? sheetView(surah, v) : closeSheet(); }
    return;
  }
  delete main.dataset.surah; closeSheet(); surahView.unsub?.(); player.stop();
  parts[0] === 'about' ? aboutView() : homeView();
}

(async function init() {
  try { quran = await loadQuran(); }
  catch (e) { main.textContent = e.message; return; }
  window.addEventListener('hashchange', route);
  route();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
