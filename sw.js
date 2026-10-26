// Cache name is tied to the app version — bump this with every build so
// devices automatically drop the old cache and fetch fresh files.
const CACHE = 'murdough-matrix-v3.10';
const ASSETS = ['/murdough-matrix/', '/murdough-matrix/index.html', '/murdough-matrix/manifest.json'];
// Excel export library (CDN). Cached so the export works offline; best-effort so a CDN
// hiccup can never block a service-worker install.
const XLSX_URL = 'https://cdn.jsdelivr.net/npm/xlsx-js-style@1.2.0/dist/xlsx.bundle.js';

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      c.addAll(ASSETS).then(() =>
        fetch(XLSX_URL, { mode: 'no-cors' }).then(res => c.put(XLSX_URL, res)).catch(() => {})
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// (Update checks are driven from the page — see index.html — because a timer in here dies
// whenever the browser stops the idle worker.)

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('supabase.co')) return;
  // For index.html: network-first so updates are picked up immediately on refresh.
  if (e.request.url.endsWith('/murdough-matrix/') || e.request.url.endsWith('/index.html')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }
  if (e.request.url.includes('fonts.googleapis.com') || e.request.url.includes('fonts.gstatic.com') || e.request.url === XLSX_URL) {
    e.respondWith(
      caches.open(CACHE).then(c =>
        c.match(e.request).then(cached =>
          cached || fetch(e.request).then(res => { c.put(e.request, res.clone()); return res; })
        )
      )
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
