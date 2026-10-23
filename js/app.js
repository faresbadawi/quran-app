import { t, setLang } from './i18n.js';
import { loadQuran } from './data.js';
import { settings, setSetting, isLearned, setLearned, learnedCount, saveCheck, resetAll,
  mistakes, addMistake, clearMistake, touchDay, streak, lastPos, setLastPos } from './store.js';
import * as player from './player.js';
import { hiddenIndexes } from './hide.js';
import { compareVerse } from './compare.js';
import { Recorder, loadModel, transcribe, decodeTo16k, modelReady } from './recite.js';

setLang('de');
const $ = (sel, root = document) => root.querySelector(sel);
const main = $('#main');
let quran;
const surahOf = (n) => quran.surahs.find((s) => s.number === n);

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
const arNum = (n) => n.toLocaleString('ar-EG');

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
  stop: '<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>',
  back: '<path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
  chev: '<path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor"/><path d="M5 11a7 7 0 0014 0M12 18v3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  eye: '<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="12" cy="12" r="3" fill="currentColor"/>',
  eyeOff: '<path d="M3 3l18 18M10.6 6a9.6 9.6 0 011.4-.1c6.4 0 10 6.1 10 6.1a17 17 0 01-3.2 3.7M6.2 7.6A16.5 16.5 0 002 12s3.6 6.5 10 6.5c1.7 0 3.2-.4 4.5-1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
  gear: '<circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  flame: '<path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 01-10 0c0-2 1-3 2-4 0 2 1 2.5 1.5 2.5C10 8 11 5 12 3z" fill="currentColor"/>',
  warn: '<path d="M12 4l9 16H3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 10v4M12 17v.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
};
const iconBtn = (cls, ic, label, onclick) => h('button', { class: cls, type: 'button', 'aria-label': label, title: label, onclick }, icon(ICON[ic]));

// ---------- Startseite ----------
function homeView() {
  const sn = streak(), errs = mistakes(), last = lastPos();
  const lastSurah = last && surahOf(last.s);
  main.replaceChildren(
    h('header', { class: 'top home' },
      h('div', { class: 'grow' }, h('h1', {}, t('appTitle')), h('p', { class: 'sub' }, t('appSub'))),
      h('span', { class: 'streak' + (sn ? ' on' : ''), title: t('streakDays', { n: sn }), 'aria-label': t('streakDays', { n: sn }) }, icon(ICON.flame), String(sn)),
      iconBtn('icon-btn', 'gear', t('settings'), () => { location.hash = '#/about'; })),
    lastSurah ? h('a', { class: 'card hero', href: `#/s/${last.s}/${last.v}` },
      h('span', { class: 'meta' }, h('small', {}, t('continue')), h('b', {}, t('continueAt', { sure: lastSurah.translit, n: last.v }))),
      h('span', { class: 'ar-name', lang: 'ar', dir: 'rtl' }, lastSurah.name), icon(ICON.chev)) : null,
    h('section', { class: 'list' }, quran.surahs.map((s) => {
      const done = learnedCount(s.number), total = s.verses.length;
      return h('a', { class: 'card surah', href: `#/s/${s.number}` },
        h('span', { class: 'num' }, String(s.number)),
        h('span', { class: 'meta' },
          h('b', {}, s.translit), h('span', {}, `${s.de} · ${t('verses', { n: total })}`),
          h('span', { class: 'bar', role: 'progressbar', 'aria-valuenow': done, 'aria-valuemax': total, 'aria-label': t('memorized', { n: done, total }) }, h('i', { style: `width:${(done / total) * 100}%` })),
          h('small', {}, t('memorized', { n: done, total }))),
        h('span', { class: 'ar-name', lang: 'ar', dir: 'rtl' }, s.name), icon(ICON.chev));
    })),
    h('a', { class: 'card', href: '#/mistakes' },
      h('span', { class: 'num warn' }, icon(ICON.warn)),
      h('span', { class: 'meta' }, h('b', {}, t('myMistakes')), h('span', {}, errs.length ? t('mistakesCount', { n: errs.length }) : '–')), icon(ICON.chev)),
    h('p', { class: 'foot' }, t('sourceText')));
  window.scrollTo(0, 0);
}

// ---------- Meine Fehler ----------
function mistakesView() {
  const list = mistakes();
  main.replaceChildren(
    h('header', { class: 'top' }, h('a', { class: 'icon-btn', href: '#/', 'aria-label': t('back') }, icon(ICON.back)), h('div', { class: 'grow' }, h('h1', {}, t('myMistakes')))),
    list.length ? h('section', { class: 'list' }, list.map((m) => {
      const s = surahOf(m.s), word = s.verses[m.v - 1].words[m.i];
      return h('a', { class: 'card mistake', href: `#/s/${m.s}/${m.v}` },
        h('span', { class: 'ar-name big', lang: 'ar', dir: 'rtl' }, word),
        h('span', { class: 'meta' }, h('b', {}, `${s.translit} · ${t('verseOf', { n: m.v })}`),
          h('span', { lang: m.heard ? 'ar' : undefined, dir: m.heard ? 'rtl' : undefined }, m.heard ? t('mistakeHeard', { w: m.heard }) : t('mistakeMissing'))), icon(ICON.chev));
    })) : h('p', { class: 'hint pad' }, t('mistakesNone')));
  window.scrollTo(0, 0);
}

// ---------- Leseansicht (Mushaf-Fluss) ----------
let reader = null;
function readerView(num, startVerse) {
  const surah = surahOf(num);
  if (!surah) { location.hash = '#/'; return; }
  reader?.dispose();
  const R = reader = {
    surah, sel: Math.min(Math.max(startVerse || lastPosFor(num), 1), surah.verses.length),
    hide: settings().hide, revealed: new Set(), marks: new Map(), busy: null, playing: null, rec: null, disposed: false, off: [],
  };
  const flow = h('div', { class: 'mushaf', lang: 'ar', dir: 'rtl' });
  const info = h('div', { class: 'info', hidden: true });
  const chip = h('div', { class: 'vchip' });
  const micBtn = h('button', { class: 'mic', type: 'button' });
  const playBtn = h('button', { class: 'round', type: 'button' });
  const hideBtn = h('button', { class: 'round', type: 'button' });
  const status = h('p', { class: 'dock-status' });
  const dock = h('div', { class: 'dock' }, info, chip,
    h('div', { class: 'dock-row' }, h('div', { class: 'side' }, playBtn), micBtn, h('div', { class: 'side' }, hideBtn)), status);

  // --- Text zeichnen ---
  function renderFlow() {
    const kids = [];
    surah.verses.forEach((v) => {
      const hid = hiddenIndexes(surah.number, v.n, v.words.length, R.hide);
      v.words.forEach((w, i) => {
        const key = `${v.n}:${i}`, mark = R.marks.get(key);
        const cls = ['w'];
        if (R.sel === v.n) cls.push('sel');
        if (R.playing === v.n) cls.push('playing');
        if (mark) cls.push('m-' + mark.status);
        if (hid.has(i) && !R.revealed.has(key) && !(mark && mark.status !== 'rest')) {
          const len = Math.max(2, [...w.replace(/[ً-ٰٟۖ-ۭ]/g, '')].length);
          kids.push(h('button', { type: 'button', class: cls.concat('hid').join(' '), style: `--len:${len}`, 'aria-label': '•', 'data-v': v.n,
            onclick: () => { R.revealed.add(key); R.sel = v.n; renderFlow(); renderDock(); } }), ' ');
        } else {
          kids.push(h('span', { class: cls.join(' '), 'data-v': v.n, 'data-i': i,
            onclick: () => onWord(v.n, i, mark) }, w), ' ');
        }
      });
      kids.push(h('span', { class: 'vend' + (isLearned(surah.number, v.n) ? ' done' : ''), 'data-v': v.n, onclick: () => selectVerse(v.n) }, arNum(v.n)), ' ');
    });
    flow.replaceChildren(...kids);
  }

  function onWord(v, i, mark) {
    if (R.sel !== v) { R.sel = v; renderFlow(); renderDock(); }
    if (mark && ['wrong', 'missing', 'close'].includes(mark.status)) showWordInfo(v, i, mark);
    else if (!R.busy) hideInfo();
  }

  function selectVerse(v) {
    R.sel = v; setLastPos(surah.number, v);
    renderFlow(); renderDock(); hideInfo();
  }

  // --- Info-Bereich über dem Dock ---
  function hideInfo() { info.hidden = true; info.replaceChildren(); }
  function showInfo(...kids) { info.hidden = false; info.replaceChildren(...kids); }
  function showWordInfo(v, i, mark) {
    const word = surah.verses[v - 1].words[i];
    showInfo(
      h('div', { class: 'wordinfo' },
        h('div', {}, h('small', {}, t('wordYou')), h('span', { class: 'ar', lang: 'ar', dir: 'rtl' }, mark.heard || t('wordNone'))),
        h('div', {}, h('small', {}, t('wordRight')), h('span', { class: 'ar ok', lang: 'ar', dir: 'rtl' }, word)),
        iconBtn('icon-btn sm', 'play', t('play'), () => playVerse(v))));
  }

  // --- Dock ---
  function renderDock() {
    const v = surah.verses[R.sel - 1];
    chip.replaceChildren(
      iconBtn('chip-btn', 'back', t('prev'), () => R.sel > 1 && selectVerse(R.sel - 1)),
      h('span', { class: 'vlabel' }, `${surah.translit} · ${t('verseOf', { n: R.sel })}`),
      iconBtn('chip-btn', 'chev', t('next'), () => R.sel < surah.verses.length && selectVerse(R.sel + 1)),
      h('button', { class: 'chip learn' + (isLearned(surah.number, R.sel) ? ' on' : ''), type: 'button', 'aria-pressed': String(isLearned(surah.number, R.sel)),
        onclick: () => { setLearned(surah.number, R.sel, !isLearned(surah.number, R.sel)); renderFlow(); renderDock(); } },
        icon(ICON.check), t('learned')),
      h('button', { class: 'chip', type: 'button', onclick: () => { const opts = [1, 3, 5, 10]; setSetting('repeat', opts[(opts.indexOf(settings().repeat) + 1) % opts.length]); renderDock(); } }, t('times', { n: settings().repeat })),
      h('button', { class: 'chip', type: 'button', onclick: () => { setSetting('rate', settings().rate === 1 ? 0.75 : 1); renderDock(); } }, `${settings().rate}×`));
    const playing = R.playing === R.sel;
    playBtn.className = 'round'; playBtn.setAttribute('aria-label', playing ? t('pause') : t('play')); playBtn.title = playBtn.getAttribute('aria-label');
    playBtn.replaceChildren(icon(ICON[playing ? 'stop' : 'play']), h('small', {}, playing ? t('pause') : t('hear')));
    playBtn.onclick = () => (R.playing === R.sel ? player.stop() : playVerse(R.sel));
    hideBtn.setAttribute('aria-label', t('hide')); hideBtn.title = t('hide');
    hideBtn.replaceChildren(icon(ICON[R.hide ? 'eyeOff' : 'eye']), h('small', {}, t('hide' + R.hide)));
    hideBtn.onclick = () => { R.hide = { 0: 2, 2: 3, 3: 0 }[R.hide]; setSetting('hide', R.hide); R.revealed.clear(); R.marks.clear(); renderFlow(); renderDock(); if (R.hide) toastInfo(t('hideHint')); };
    // Mikrofon
    micBtn.className = 'mic' + (R.rec ? ' rec' : '') + (R.busy === 'processing' ? ' busy' : '');
    micBtn.disabled = R.busy === 'processing' || R.busy === 'loading';
    micBtn.setAttribute('aria-label', R.rec ? t('micStop') : t('mic'));
    micBtn.replaceChildren(h('i', { class: 'ring' }), icon(ICON[R.rec ? 'stop' : 'mic']));
    micBtn.onclick = () => (R.rec ? finishRecording() : startRecitation());
    if (!R.busy && !R.rec && !status.dataset.sticky) status.textContent = t('startFrom', { n: R.sel });
  }
  let infoTimer;
  function toastInfo(msg) { showInfo(h('p', { class: 'hint' }, msg)); clearTimeout(infoTimer); infoTimer = setTimeout(() => { if (!R.busy) hideInfo(); }, 5000); }
  const setStatus = (msg, sticky = false) => { status.textContent = msg; if (sticky) status.dataset.sticky = '1'; else delete status.dataset.sticky; };

  // --- Hören ---
  function playVerse(v) {
    touchDay(); setLastPos(surah.number, v);
    player.play([{ s: surah.number, v }], { repeat: settings().repeat, rate: settings().rate });
  }
  R.off.push(player.onPlayback((c) => {
    const v = c && c.s === surah.number ? c.v : null;
    if (v !== R.playing) { R.playing = v; renderFlow(); renderDock(); }
  }));

  // --- Rezitieren ---
  async function startRecitation() {
    if (R.busy || R.rec) return;
    player.stop(); hideInfo(); R.marks.clear(); renderFlow();
    if (!modelReady()) {
      if (!settings().modelConsent) {
        showInfo(h('p', { class: 'hint' }, t('modelNeeded')),
          h('button', { class: 'btn primary wide', type: 'button', onclick: () => { setSetting('modelConsent', true); hideInfo(); startRecitation(); } }, t('modelLoad')));
        return;
      }
      R.busy = 'loading'; renderDock(); setStatus(t('modelLoading', { p: 0 }), true);
      try { await loadModel((p) => { if (!R.disposed) setStatus(t('modelLoading', { p }), true); }); }
      catch (e) { R.busy = null; setStatus(''); setSetting('modelConsent', false); showInfo(h('p', { class: 'hint err' }, t('error', { msg: e.message }))); renderDock(); return; }
      R.busy = null; setStatus('');
      if (R.disposed) return;
    }
    const rec = new Recorder();
    try { await rec.start({ onLevel: (l) => micBtn.style.setProperty('--lvl', l.toFixed(2)), onSilence: () => finishRecording() }); }
    catch (e) { setStatus(''); showInfo(h('p', { class: 'hint err' }, e.message === 'missing' ? t('micMissing') : t('micDenied'))); renderDock(); return; }
    R.rec = rec; R.recTimeout = setTimeout(finishRecording, 28000);
    setStatus(t('recording', { n: R.sel }), true); showInfo(h('p', { class: 'hint' }, t('recordingHint'))); renderDock();
  }

  async function finishRecording() {
    const rec = R.rec; if (!rec) return;
    R.rec = null; clearTimeout(R.recTimeout); micBtn.style.removeProperty('--lvl');
    R.busy = 'processing'; renderDock(); setStatus(t('processing'), true); hideInfo();
    const startV = R.sel;
    try {
      const { blob, ms } = await rec.stop();
      if (ms < 800) { setStatus(''); showInfo(h('p', { class: 'hint err' }, t('tooShort'))); return; }
      const heard = await transcribe(await decodeTo16k(blob));
      if (R.disposed) return;
      applyResult(startV, heard);
    } catch (e) { setStatus(''); showInfo(h('p', { class: 'hint err' }, t('error', { msg: e.message }))); }
    finally { R.busy = null; if (!R.disposed) renderDock(); }
  }

  function applyResult(startV, heard) {
    touchDay();
    // Erwartet: ab dem gewählten Vers bis höchstens 110 Wörter weiter (passt in ca. 30 s).
    const exp = [];
    for (let v = startV; v <= surah.verses.length && exp.length < 110; v++) surah.verses[v - 1].words.forEach((w, i) => exp.push({ v, i, w }));
    const res = compareVerse(exp.map((e) => e.w), heard, { open: true });
    if (!res.total || res.ok === 0) { setStatus(''); showInfo(h('p', { class: 'hint err' }, t('nothingHeard'))); return; }
    R.marks.clear();
    let bad = 0, lastV = startV;
    const verseOk = new Map();
    res.words.forEach((r, k) => {
      const { v, i } = exp[k];
      R.marks.set(`${v}:${i}`, r);
      if (r.status === 'rest') return;
      lastV = v;
      verseOk.set(v, (verseOk.get(v) ?? true) && r.status === 'ok');
      if (r.status === 'ok') clearMistake(surah.number, v, i);
      else if (r.status === 'wrong' || r.status === 'missing') { bad++; addMistake({ s: surah.number, v, i, heard: r.heard }); }
    });
    // Nur ganz gesprochene Verse (nicht der zuletzt angefangene) können beim verdeckten Text automatisch als „gelernt“ gelten.
    let learned = 0;
    if (R.hide === 3) verseOk.forEach((ok, v) => { if (ok && v < lastV && !isLearned(surah.number, v)) { setLearned(surah.number, v, true); learned++; } });
    saveCheck(surah.number, startV, res.score);
    setLastPos(surah.number, Math.min(lastV + 1, surah.verses.length));
    R.sel = Math.min(lastV + 1, surah.verses.length);
    renderFlow(); renderDock();
    setStatus('');
    showInfo(
      h('p', { class: 'score' }, t('resultTitle', { ok: res.ok, total: res.total })),
      h('p', { class: 'hint' }, bad ? t('resultMistakes', { n: bad }) : t('resultAllOk'), learned ? ` ${t('autoLearned', { n: learned })}` : ''),
      h('ul', { class: 'legend' }, ['ok', 'close', 'wrong', 'missing'].map((k) => h('li', { class: 'm-' + k }, t('legend' + k[0].toUpperCase() + k.slice(1))))),
      h('p', { class: 'honest' }, t('honest')));
    document.querySelector('.w.m-wrong, .w.m-missing, .w.m-close')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  R.dispose = () => { R.disposed = true; R.off.forEach((f) => f()); R.rec?.cancel(); clearTimeout(R.recTimeout); clearTimeout(infoTimer); player.stop(); document.body.classList.remove('has-dock'); };

  main.replaceChildren(
    h('header', { class: 'top' },
      h('a', { class: 'icon-btn', href: '#/', 'aria-label': t('back') }, icon(ICON.back)),
      h('div', { class: 'grow' }, h('h1', {}, surah.translit), h('p', { class: 'sub' }, `${surah.de} · ${t('verses', { n: surah.verses.length })}`)),
      h('span', { class: 'ar-name big', lang: 'ar', dir: 'rtl' }, surah.name)),
    h('p', { class: 'basmala', lang: 'ar', dir: 'rtl' }, quran.basmala),
    flow, dock);
  document.body.classList.add('has-dock');
  renderFlow(); renderDock();
  setLastPos(surah.number, R.sel);
  if (startVerse) requestAnimationFrame(() => flow.querySelector(`.vend[data-v="${R.sel}"]`)?.scrollIntoView({ block: 'center' }));
  else window.scrollTo(0, 0);
}
function lastPosFor(num) { const l = lastPos(); return l && l.s === num ? l.v : 1; }

// ---------- Einstellungen ----------
function aboutView() {
  const s = settings();
  const opt = (key, val, label) => h('button', { type: 'button', class: 'chip' + (s[key] === val ? ' on' : ''), onclick: () => { setSetting(key, val); applyAppearance(); aboutView(); } }, label);
  main.replaceChildren(
    h('header', { class: 'top' }, h('a', { class: 'icon-btn', href: '#/', 'aria-label': t('back') }, icon(ICON.back)), h('div', { class: 'grow' }, h('h1', {}, t('settings')))),
    h('section', { class: 'prose' },
      h('h3', {}, t('theme')), h('div', { class: 'chips' }, opt('theme', 'auto', t('themeAuto')), opt('theme', 'light', t('themeLight')), opt('theme', 'dark', t('themeDark'))),
      h('h3', {}, t('textSize')), h('div', { class: 'chips' }, opt('size', 0.9, 'A−'), opt('size', 1, 'A'), opt('size', 1.2, 'A+'), opt('size', 1.4, 'A++')),
      h('h3', {}, t('source')),
      h('p', {}, 'Text: Tanzil Quran Text (Uthmani), unverändert, Quelle tanzil.net (Lizenz: tanzil.net/docs/quran_text_license), abgerufen über api.alquran.cloud und gegen Quran.com geprüft.'),
      h('p', {}, 'Audio: Mishary Alafasy (64 kbps) von EveryAyah.com, unverändert, nicht-kommerziell.'),
      h('p', {}, 'Schrift: Amiri Quran (SIL Open Font License).'),
      h('p', {}, 'Spracherkennung: Tarteel whisper-base-ar-quran (Apache-2.0), als ONNX-Konvertierung „iqbalaesthetic/Basira“, läuft lokal im Browser. Diese App ist unabhängig und nicht mit Tarteel verbunden.'),
      h('p', { class: 'honest' }, t('honest')),
      h('button', { class: 'btn danger', type: 'button', onclick: () => { if (confirm(t('confirmReset'))) { resetAll(); aboutView(); } } }, t('resetProgress'))));
  window.scrollTo(0, 0);
}

// ---------- Routing ----------
function route() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (parts[0] === 's' && parts[1]) {
    const n = +parts[1], v = parts[2] ? +parts[2] : 0;
    // Gleiche Sure erneut (z. B. Sprung zu einem Vers): Ansicht neu aufbauen, laufende Aufnahme wird verworfen.
    readerView(n, v); return;
  }
  reader?.dispose(); reader = null;
  if (parts[0] === 'about') aboutView();
  else if (parts[0] === 'mistakes') mistakesView();
  else homeView();
}

(async function init() {
  try { quran = await loadQuran(); } catch (e) { main.textContent = e.message; return; }
  window.addEventListener('hashchange', route);
  route();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
