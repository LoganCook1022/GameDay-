/* global importScripts, firebase */
/**
 * GameDay+ - Firebase Cloud Messaging service worker
 *
 * Runs independently of the page (required for web push). It initializes a
 * compat Firebase app, then handles background push messages and notification
 * clicks. Notification payloads are produced by services/send-notifications.js.
 */

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Populated at deploy time by copying assets/js/firebase-config.js values here.
// Kept inline because a service worker cannot read window globals.
self.GAMEDAY_FIREBASE_CONFIG = self.GAMEDAY_FIREBASE_CONFIG || {
  apiKey: 'AIzaSyCK7SSWZR9qovEPry2xYZ9MiRur7sS4Buw',
  authDomain: 'school-project-6dd54.firebaseapp.com',
  projectId: 'school-project-6dd54',
  storageBucket: 'school-project-6dd54.firebasestorage.app',
  messagingSenderId: '1063355019441',
  appId: '1:1063355019441:web:bd1c06d722202e7d033290'
};

try {
  if (!firebase.apps.length) {
    firebase.initializeApp(self.GAMEDAY_FIREBASE_CONFIG);
  }
} catch (err) {
  // A messaging app may already exist; ignore duplicate-init errors.
}

let messaging = null;
try {
  messaging = firebase.messaging();
} catch (_) {
  messaging = null;
}

if (messaging && messaging.onBackgroundMessage) {
  messaging.onBackgroundMessage(payload => {
    const notification = (payload && payload.notification) || {};
    const data = (payload && payload.data) || {};
    const title = notification.title || data.title || 'GameDay+ update';
    const options = {
      body: notification.body || data.body || 'There is a change to your schedule.',
      icon: data.icon || '/assets/img/icon-192.png',
      badge: '/assets/img/icon-192.png',
      tag: data.tag || 'gameday-update',
      data: {
        url: data.url || '/',
        eventId: data.eventId || ''
      }
    };
    return self.registration.showNotification(title, options);
  });
}

// Focus an existing tab when possible, otherwise open a new one.
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const data = (event.notification && event.notification.data) || {};
  const targetUrl = data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (const client of windowClients) {
        const clientUrl = new URL(client.url);
        const target = new URL(targetUrl, self.location.origin);
        if (clientUrl.pathname === target.pathname && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
      return undefined;
    })
  );
});
