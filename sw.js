const CACHE_NAME = 'mealplan-v1';

const CORE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './extracted%20recipes/all_recipes.json'
];

// Install: Cache core app shell and recipe database
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      // Use individual try/catch so missing optional asset doesn't fail install
      for (const asset of CORE_ASSETS) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn('[SW] Pre-caching skipped for:', asset, err);
        }
      }
      return self.skipWaiting();
    })
  );
});

// Activate: Clean up old caches and take control
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Stale-while-revalidate for data & app shell; Cache-first for images
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Ignore non-GET and cross-origin requests
  if (event.request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  // Recipe images (*.jpg) - Cache-first with background cache store
  if (url.pathname.endsWith('.jpg') || url.pathname.endsWith('.jpeg') || url.pathname.endsWith('.png')) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) return cachedResponse;

        return fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return networkResponse;
        }).catch(() => {
          // If offline and image not cached, return null or fallback
          return new Response('', { status: 408, statusText: 'Offline image unavailable' });
        });
      })
    );
    return;
  }

  // App Shell & Recipe Database - Stale-while-revalidate
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return networkResponse;
      }).catch(err => {
        // Offline and not in cache
        console.log('[SW] Fetch failed offline:', event.request.url);
        if (cachedResponse) return cachedResponse;
        return new Response('Offline resource unavailable', {
          status: 503,
          statusText: 'Offline',
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      });

      return cachedResponse || fetchPromise;
    })
  );
});

