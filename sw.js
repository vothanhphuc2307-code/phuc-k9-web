/* ============================================================================
 * HỌC CÙNG PHÚC K9 — PRODUCTION SERVICE WORKER (NETWORK-FIRST + SMART CACHE)
 * ============================================================================ */
const CACHE_NAME = 'phuc-k9-ecosystem-v31';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/assets/exam-center.css',
  '/assets/pk9-curriculum.js',
  '/assets/exam-center.js',
  '/assets/pk9-app.js',
  '/favicon.ico',
  '/assets/logo-phuc-k9.png',
  '/assets/phuc-k9-favicon.png',
  '/assets/og-phuc-k9.jpg'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)).catch(() => {})
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.pathname.startsWith('/api/')) return;

  event.respondWith(
    fetch(req)
      .then(resp => {
        if (resp && resp.status === 200 && url.origin === self.location.origin) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone)).catch(() => {});
        }
        return resp;
      })
      .catch(() => caches.match(req).then(hit => hit || caches.match('/index.html')))
  );
});
