'use strict';

// Bump the version whenever any precached file changes — activation drops the old cache.
const CACHE = 'mit-filipa-v2';
const PRECACHE = [
  './',
  'index.html',
  'kvizove_otazky.json',
  'manifest.json',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png',
  'apple-touch-icon.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Cache-first for everything, so the app opens instantly with no network.
// A `?fresh` query marks a deliberate background refresh: go to the network
// and overwrite the cached copy under its canonical URL (query stripped).
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  const canonical = url.origin + url.pathname;
  const wantsFresh = url.searchParams.has('fresh');

  e.respondWith((async () => {
    if (!wantsFresh) {
      const cached = await caches.match(req, { ignoreSearch: true });
      if (cached) return cached;
    }
    try {
      const res = await fetch(req);
      if (res.ok) {
        const c = await caches.open(CACHE);
        await c.put(canonical, res.clone());
      }
      return res;
    } catch (err) {
      const cached = await caches.match(canonical);
      if (cached) return cached;
      throw err;
    }
  })());
});
