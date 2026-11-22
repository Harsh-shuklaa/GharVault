// GharVault Progressive Web App Service Worker
// Version: 2.5.1

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
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
    icon: '/icon-192.svg',
    badge: '/icon-192.svg',
    tag: data.tag || 'gharvault-update-' + Date.now(),
    renotify: true,
    vibrate: [200, 100, 200, 100, 250],
    data: {
      url: data.url || '/dashboard',
      timestamp: data.timestamp || Date.now(),
    },
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
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
    self.registration.pushManager.subscribe(event.oldSubscription.options)
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
