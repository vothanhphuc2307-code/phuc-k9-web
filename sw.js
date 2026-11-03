/* Temporary maintenance shell. Replaces any older Phuc K9 app cache. */
const VERSION = 'phuc-k9-maintenance-20261104';
const SHELL = ['/'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(VERSION)
      .then(cache => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== VERSION).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || request.mode !== 'navigate') return;

  event.respondWith(
    fetch(request).then(response => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(VERSION).then(cache => cache.put('/', copy));
      }
      return response;
    }).catch(() => caches.match('/').then(cached => cached || new Response(
      '<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>KHÓA APP — PHÚC K9</title><body style="margin:0;background:#090b18;color:#fff;font:700 20px system-ui;display:grid;place-items:center;min-height:100vh;text-align:center;padding:24px">KHÓA APP<br><br>PHÚC K9 TẠM NGƯNG HOẠT ĐỘNG</body></html>',
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )))
  );
});
