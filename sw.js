// IRON LOG — Service Worker
const CACHE = 'WHEAT-v1';
const BASE = '/WHEAT';
const ASSETS = [
  BASE + '/',
  BASE + '/index.html',
  BASE + '/manifest.json',
  BASE + '/icon-192.png',
  BASE + '/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Inter:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap'
];

// Install — cache all assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      return Promise.allSettled(
        ASSETS.map(url => cache.add(url).catch(() => {}))
      );
    }).then(() => self.skipWaiting())
  );
});

// Activate — delete old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — cache first, fallback to network
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('firestore.googleapis.com')) return;
  if (e.request.url.includes('fonts.googleapis.com') ||
      e.request.url.includes('fonts.gstatic.com')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => {
        if (e.request.mode === 'navigate') {
          return caches.match(BASE + '/index.html');
        }
      });
    })
  );
});
