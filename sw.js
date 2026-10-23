// Service Worker: legt alle App-Dateien (inkl. Text und Audio der 3 Suren) beim ersten Besuch im Cache ab -> komplett offline nutzbar.
// Die Liste unten wird von `node tools/update-sw.mjs` erzeugt (vor jedem Veröffentlichen ausführen).
/* BEGIN GENERATED */
const CACHE = 'qapp-7b84d87e4e';
const FILES = [
  "./",
  "./audio/alafasy64/078001.mp3",
  "./audio/alafasy64/078002.mp3",
  "./audio/alafasy64/078003.mp3",
  "./audio/alafasy64/078004.mp3",
  "./audio/alafasy64/078005.mp3",
  "./audio/alafasy64/078006.mp3",
  "./audio/alafasy64/078007.mp3",
  "./audio/alafasy64/078008.mp3",
  "./audio/alafasy64/078009.mp3",
  "./audio/alafasy64/078010.mp3",
  "./audio/alafasy64/078011.mp3",
  "./audio/alafasy64/078012.mp3",
  "./audio/alafasy64/078013.mp3",
  "./audio/alafasy64/078014.mp3",
  "./audio/alafasy64/078015.mp3",
  "./audio/alafasy64/078016.mp3",
  "./audio/alafasy64/078017.mp3",
  "./audio/alafasy64/078018.mp3",
  "./audio/alafasy64/078019.mp3",
  "./audio/alafasy64/078020.mp3",
  "./audio/alafasy64/078021.mp3",
  "./audio/alafasy64/078022.mp3",
  "./audio/alafasy64/078023.mp3",
  "./audio/alafasy64/078024.mp3",
  "./audio/alafasy64/078025.mp3",
  "./audio/alafasy64/078026.mp3",
  "./audio/alafasy64/078027.mp3",
  "./audio/alafasy64/078028.mp3",
  "./audio/alafasy64/078029.mp3",
  "./audio/alafasy64/078030.mp3",
  "./audio/alafasy64/078031.mp3",
  "./audio/alafasy64/078032.mp3",
  "./audio/alafasy64/078033.mp3",
  "./audio/alafasy64/078034.mp3",
  "./audio/alafasy64/078035.mp3",
  "./audio/alafasy64/078036.mp3",
  "./audio/alafasy64/078037.mp3",
  "./audio/alafasy64/078038.mp3",
  "./audio/alafasy64/078039.mp3",
  "./audio/alafasy64/078040.mp3",
  "./audio/alafasy64/079001.mp3",
  "./audio/alafasy64/079002.mp3",
  "./audio/alafasy64/079003.mp3",
  "./audio/alafasy64/079004.mp3",
  "./audio/alafasy64/079005.mp3",
  "./audio/alafasy64/079006.mp3",
  "./audio/alafasy64/079007.mp3",
  "./audio/alafasy64/079008.mp3",
  "./audio/alafasy64/079009.mp3",
  "./audio/alafasy64/079010.mp3",
  "./audio/alafasy64/079011.mp3",
  "./audio/alafasy64/079012.mp3",
  "./audio/alafasy64/079013.mp3",
  "./audio/alafasy64/079014.mp3",
  "./audio/alafasy64/079015.mp3",
  "./audio/alafasy64/079016.mp3",
  "./audio/alafasy64/079017.mp3",
  "./audio/alafasy64/079018.mp3",
  "./audio/alafasy64/079019.mp3",
  "./audio/alafasy64/079020.mp3",
  "./audio/alafasy64/079021.mp3",
  "./audio/alafasy64/079022.mp3",
  "./audio/alafasy64/079023.mp3",
  "./audio/alafasy64/079024.mp3",
  "./audio/alafasy64/079025.mp3",
  "./audio/alafasy64/079026.mp3",
  "./audio/alafasy64/079027.mp3",
  "./audio/alafasy64/079028.mp3",
  "./audio/alafasy64/079029.mp3",
  "./audio/alafasy64/079030.mp3",
  "./audio/alafasy64/079031.mp3",
  "./audio/alafasy64/079032.mp3",
  "./audio/alafasy64/079033.mp3",
  "./audio/alafasy64/079034.mp3",
  "./audio/alafasy64/079035.mp3",
  "./audio/alafasy64/079036.mp3",
  "./audio/alafasy64/079037.mp3",
  "./audio/alafasy64/079038.mp3",
  "./audio/alafasy64/079039.mp3",
  "./audio/alafasy64/079040.mp3",
  "./audio/alafasy64/079041.mp3",
  "./audio/alafasy64/079042.mp3",
  "./audio/alafasy64/079043.mp3",
  "./audio/alafasy64/079044.mp3",
  "./audio/alafasy64/079045.mp3",
  "./audio/alafasy64/079046.mp3",
  "./audio/alafasy64/080001.mp3",
  "./audio/alafasy64/080002.mp3",
  "./audio/alafasy64/080003.mp3",
  "./audio/alafasy64/080004.mp3",
  "./audio/alafasy64/080005.mp3",
  "./audio/alafasy64/080006.mp3",
  "./audio/alafasy64/080007.mp3",
  "./audio/alafasy64/080008.mp3",
  "./audio/alafasy64/080009.mp3",
  "./audio/alafasy64/080010.mp3",
  "./audio/alafasy64/080011.mp3",
  "./audio/alafasy64/080012.mp3",
  "./audio/alafasy64/080013.mp3",
  "./audio/alafasy64/080014.mp3",
  "./audio/alafasy64/080015.mp3",
  "./audio/alafasy64/080016.mp3",
  "./audio/alafasy64/080017.mp3",
  "./audio/alafasy64/080018.mp3",
  "./audio/alafasy64/080019.mp3",
  "./audio/alafasy64/080020.mp3",
  "./audio/alafasy64/080021.mp3",
  "./audio/alafasy64/080022.mp3",
  "./audio/alafasy64/080023.mp3",
  "./audio/alafasy64/080024.mp3",
  "./audio/alafasy64/080025.mp3",
  "./audio/alafasy64/080026.mp3",
  "./audio/alafasy64/080027.mp3",
  "./audio/alafasy64/080028.mp3",
  "./audio/alafasy64/080029.mp3",
  "./audio/alafasy64/080030.mp3",
  "./audio/alafasy64/080031.mp3",
  "./audio/alafasy64/080032.mp3",
  "./audio/alafasy64/080033.mp3",
  "./audio/alafasy64/080034.mp3",
  "./audio/alafasy64/080035.mp3",
  "./audio/alafasy64/080036.mp3",
  "./audio/alafasy64/080037.mp3",
  "./audio/alafasy64/080038.mp3",
  "./audio/alafasy64/080039.mp3",
  "./audio/alafasy64/080040.mp3",
  "./audio/alafasy64/080041.mp3",
  "./audio/alafasy64/080042.mp3",
  "./css/style.css",
  "./data/quran.json",
  "./fonts/AmiriQuran-Regular.ttf",
  "./fonts/OFL-AmiriQuran.txt",
  "./icons/apple-touch-icon.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./index.html",
  "./js/app.js",
  "./js/asr-worker.js",
  "./js/compare.js",
  "./js/data.js",
  "./js/hide.js",
  "./js/i18n.js",
  "./js/lang/de.js",
  "./js/player.js",
  "./js/recite.js",
  "./js/store.js",
  "./manifest.webmanifest"
];
/* END GENERATED */
const RUNTIME = 'runtime-lib'; // Spracherkennungs-Bibliothek (jsDelivr), wird beim ersten Prüfen zwischengespeichert

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => Promise.all(FILES.map((f) => fetch(new Request(f, { cache: 'reload' })).then((res) => {
        if (!res.ok) throw new Error(f + ' ' + res.status);
        return cache.put(f, res);
      }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('qapp-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Audio-Dateien: aus dem Cache, mit Range-Unterstützung (Safari/iOS verlangt 206-Antworten für <audio>).
async function audioFromCache(req) {
  const hit = await caches.match(req, { ignoreVary: true, ignoreSearch: true });
  if (!hit) return fetch(req);
  const range = req.headers.get('range');
  if (!range) return hit;
  const buf = await hit.arrayBuffer();
  const m = /bytes=(\d*)-(\d*)/.exec(range);
  const start = m[1] ? +m[1] : 0, end = m[2] ? Math.min(+m[2], buf.byteLength - 1) : buf.byteLength - 1;
  return new Response(buf.slice(start, end + 1), { status: 206, headers: {
    'Content-Type': 'audio/mpeg', 'Accept-Ranges': 'bytes', 'Content-Length': String(end - start + 1),
    'Content-Range': `bytes ${start}-${end}/${buf.byteLength}` } });
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === 'https://cdn.jsdelivr.net') {
    event.respondWith(caches.open(RUNTIME).then((c) => c.match(req).then((hit) => hit || fetch(req).then((res) => { if (res.ok) c.put(req, res.clone()); return res; }))));
    return;
  }
  if (url.origin !== location.origin) return;
  if (/\/(audio|fonts|icons)\//.test(url.pathname)) { event.respondWith(audioFromCache(req)); return; }
  event.respondWith(
    fetch(req, { cache: 'no-cache' })
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error())))
  );
});
