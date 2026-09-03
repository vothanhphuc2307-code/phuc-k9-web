const VERSION = 'phuc-k9-pwa-v1';
const SHELL = [
  './',
  './manifest.webmanifest',
  './offline.html',
  './assets/pwa/icon-192.png',
  './assets/pwa/icon-512.png',
  './assets/pwa/icon-maskable.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

function isApi(url){
  return url.pathname.startsWith('/api/');
}
function isLargeMedia(request){
  return request.destination === 'video' || request.destination === 'audio';
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if(req.method !== 'GET' || url.origin !== self.location.origin) return;
  if(isApi(url) || isLargeMedia(req)) return;

  if(req.mode === 'navigate'){
    event.respondWith(fetch(req).then((response) => {
      const copy = response.clone();
      caches.open(VERSION).then(cache => cache.put('./', copy)).catch(() => {});
      return response;
    }).catch(() => caches.match('./').then(r => r || caches.match('./offline.html'))));
    return;
  }

  event.respondWith(caches.match(req).then((cached) => {
    if(cached) return cached;
    return fetch(req).then((response) => {
      if(response.ok && response.type === 'basic'){
        const copy = response.clone();
        caches.open(VERSION).then(cache => cache.put(req, copy)).catch(() => {});
      }
      return response;
    });
  }).catch(() => caches.match('./offline.html')));
});
