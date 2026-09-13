const CACHE = 'japan-2026-v2.17.3';
const PREFIX = 'japan-2026-v';
const APP_SHELL = [
 './', './index.html',
 './japan-2026-app-v2.html', './japan-2026-v2.css?v=2.17.3', './japan-2026-v2.js?v=2.17.3', './access-gate.js?v=2.17.3', './manifest.json',
 './assets/app-icon.svg', './assets/app-icon-192.png', './assets/app-icon-512.png', './assets/apple-touch-icon.png',
 './assets/jogasaki-coast.webp', './assets/sagano-train.webp', './assets/kawagoe-festival.webp',
 './assets/japan-secrets-banner.webp', './assets/tanuki-omikuji.webp', './assets/japan-pop-hero-v3.webp'
];
self.addEventListener('install', event => {
 event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
 event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
 const request = event.request, url = new URL(request.url);
 if(request.method !== 'GET' || url.origin !== self.location.origin) return;
 // Cache only this shell, never unrelated pages or error responses.
 if(!APP_SHELL.some(path => new URL(path,self.registration.scope).href === url.href)) return;
 event.respondWith((async () => {
  const cache = await caches.open(CACHE), hit = await cache.match(request);
  if(request.mode !== 'navigate' && hit) return hit;
  try {
   const response = await fetch(request);
   if(response.ok) { await cache.put(request,response.clone()); return response; }
   return hit || response;
  } catch(error) { if(hit) return hit; throw error; }
 })());
});
