const VERSION='phuc-k9-ecosystem-v2-20261102';
const SHELL=['/','/offline.html','/manifest.webmanifest','/style.css','/assets/site-effects.js','/assets/pk9-source-hub.js','/assets/phuck9-study-atelier.css','/assets/phuck9-study-atelier.js','/assets/phuck9-vip.css','/assets/phuck9-vip.js','/assets/phuck9-ecosystem-v2.css','/assets/phuck9-ecosystem-v2.js','/exam-sources/lam-dong-toan-2026-lan-1.pdf','/exam-sources/dien-bien-sinh-2026-ma-0401.pdf','/assets/pwa/icon-192.png','/assets/pwa/icon-512.png','/assets/pwa/icon-maskable.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const req=e.request; const u=new URL(req.url);
  if(req.method!=='GET'||u.origin!==self.location.origin||u.pathname.startsWith('/api/')) return;
  if(req.destination==='video'||req.destination==='audio') return;
  if(req.mode==='navigate'){
    e.respondWith(fetch(req).then(r=>{const copy=r.clone();caches.open(VERSION).then(c=>c.put('/',copy));return r}).catch(()=>caches.match('/').then(r=>r||caches.match('/offline.html'))));
    return;
  }
  e.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(r=>{if(r.ok&&['script','style','image','font'].includes(req.destination)){const copy=r.clone();caches.open(VERSION).then(c=>c.put(req,copy));}return r})).catch(()=>undefined));
});
