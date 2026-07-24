// Service Worker — Biblioteca Lumethos PWA v5
const CACHE = 'bib-lumethos-v5';
const STATIC = [
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC))
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

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.pathname.startsWith('/api/')) return;
  if (url.pathname.match(/\.(png|jpg|jpeg|webp|svg|ico|css|js|woff2?|ttf|eot)$/)) {
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request))
    );
    return;
  }
  // HTML: network-only (no cache) to always get latest
  e.respondWith(fetch(e.request));
});
