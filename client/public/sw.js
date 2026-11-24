// GharVault Progressive Web App Service Worker
// Version: 2.5.2

const CACHE_NAME = 'dastavej-cache-v2';
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon-blue.svg',
  '/icon-192.png',
  '/icon-512.png',
];

// Install Event — precache core shell
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Precache partial error:', err);
      });
    })
  );
});

// Activate Event — cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
            return null;
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch Event — STRICTLY REQUIRED by Chromium for PWA Installation ('beforeinstallprompt')
self.addEventListener('fetch', (event) => {
  // Let browser handle non-GET, API calls, and browser extensions directly
  if (
    event.request.method !== 'GET' ||
    event.request.url.includes('/api/') ||
    event.request.url.startsWith('chrome-extension:')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache successful local GET requests
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          networkResponse.type === 'basic' &&
          !event.request.url.includes('/api/')
        ) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone).catch(() => {});
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // Offline cache fallback
        const cached = await caches.match(event.request);
        if (cached) return cached;

        // SPA Navigation fallback
        if (event.request.mode === 'navigate') {
          const fallback = await caches.match('/');
          if (fallback) return fallback;
        }

        return Response.error();
      })
  );
});

// Handle incoming Web Push Notifications from server
self.addEventListener('push', (event) => {
  let data = {
    title: '🔔 GharVault Update',
    body: 'Update aa gaye hain, check karein!',
    url: '/dashboard',
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text() || data.body;
    }
  }

  const title = data.title || '🔔 GharVault Update';
  const options = {
    body: data.body || 'Update aa gaye hain, abhi check karein!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || 'gharvault-update-' + Date.now(),
    renotify: true,
    vibrate: [200, 100, 200, 100, 250],
    data: {
      url: data.url || '/dashboard',
      timestamp: data.timestamp || Date.now(),
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification tap / click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Background push subscription change handler
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    self.registration.pushManager
      .subscribe(event.oldSubscription.options)
      .then((newSubscription) => {
        return fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: newSubscription }),
        });
      })
      .catch((err) => {
        console.error('[SW] pushsubscriptionchange failed:', err);
      })
  );
});
