// Minimal service worker — network-first for API, cache-first for assets
const CACHE = 'gladney-v3';
const API_PREFIX = '/api/';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Leave uploads, cross-origin files (R2) and media range requests to the browser
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || event.request.headers.has('range')) return;
  // Always network-first for API calls
  if (url.pathname.startsWith(API_PREFIX)) return;
  // Network-first for navigation
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }
  // Cache-first for static assets
  event.respondWith(
    caches.match(event.request).then(
      (cached) => cached ?? fetch(event.request).then((res) => {
        const clone = res.clone();
        caches.open(CACHE).then((c) => c.put(event.request, clone));
        return res;
      })
    )
  );
});
