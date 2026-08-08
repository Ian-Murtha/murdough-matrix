// Cache name is tied to the app version — bump this with every build so
// devices automatically drop the old cache and fetch fresh files.
const CACHE = 'murdough-matrix-v3.0';
const ASSETS = ['/murdough-matrix/', '/murdough-matrix/index.html', '/murdough-matrix/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
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

// Periodic background update check — every hour, ask the browser to check
// whether a new sw.js has been deployed. If found, the new worker installs
// silently and takes over on the next page load (no user action needed).
self.addEventListener('activate', () => {
  setInterval(() => self.registration.update(), 60 * 60 * 1000);
});

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
  if (e.request.url.includes('fonts.googleapis.com') || e.request.url.includes('fonts.gstatic.com')) {
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
