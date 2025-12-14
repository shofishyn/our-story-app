const CACHE_NAME = 'our-story-v1';
const STATIC_CACHE = [
  '/',
  '/index.html',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
];

// Install
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.map((key) => key !== CACHE_NAME && caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (!request.url.startsWith('http')) return;

  if (request.method !== 'GET') {
    event.respondWith(fetch(request));
    return;
  }

  const url = new URL(request.url);

  // API: Network First
  if (url.origin === 'https://story-api.dicoding.dev') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return res;
        })
        .catch(() => caches.match(request).then((cached) =>
          cached || new Response(JSON.stringify({ error: true, message: 'Offline' }), {
            headers: { 'Content-Type': 'application/json' }
          })
        ))
    );
    return;
  }

  // Static: Cache First
  event.respondWith(
    caches.match(request)
      .then((cached) => cached || fetch(request).then((res) => {
        if (res.ok && request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return res;
      }))
      .catch(() => request.destination === 'document' && caches.match('/index.html'))
  );
});

// Push Notification
self.addEventListener('push', (event) => {
  let title = 'Our Story';
  let options = {
    body: 'New story added!',
    icon: '/images/icon-192x192.png',
    badge: '/images/icon-72x72.png',
    tag: 'new-story',
    data: { url: '/' }
  };

  if (event.data) {
    try {
      const data = event.data.json();
      title = data.title || title;
      options.body = data.body || data.message || options.body;
      options.data.url = data.url || options.data.url;
    } catch (e) {}
  }

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification Click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then((list) => {
        for (let client of list) {
          if (client.url === url && 'focus' in client) return client.focus();
        }
        if (clients.openWindow) return clients.openWindow(url);
      })
  );
});
