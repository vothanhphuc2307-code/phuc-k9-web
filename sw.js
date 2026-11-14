/* ============================================================================
 * HỌC CÙNG PHÚC K9 — PRODUCTION SERVICE WORKER (NETWORK-FIRST + SMART CACHE)
 * ============================================================================ */
const CACHE_NAME = 'phuc-k9-ecosystem-v46';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/style.css?v=46',
  '/assets/exam-center.css?v=46',
  '/assets/pk9-curriculum.js',
  '/assets/pk9-2k9-manifest.js',
  '/assets/2k9-teachers/toan.json',
  '/assets/2k9-teachers/vat-li.json',
  '/assets/2k9-teachers/hoa-hoc.json',
  '/assets/2k9-teachers/sinh-hoc.json',
  '/assets/2k9-teachers/tieng-anh.json',
  '/assets/2k9-teachers/ngu-van.json',
  '/assets/2k9-teachers/lich-su.json',
  '/assets/2k9-teachers/dia-li.json',
  '/assets/2k9-teachers/dgnl.json',
  '/assets/pk9-2k8-curated.js',
  '/assets/pk9-2k8-dgnl.js',
  '/assets/exam-center.js?v=46',
  '/assets/pk9-rpg.js?v=46',
  '/assets/pk9-app.js?v=46',
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
