/**
 * GameDay+ - Push notification client (Firebase Cloud Messaging)
 *
 * Zero-login friendly: visitors opt in with a single tap, which requests the
 * browser notification permission and registers an FCM token for their chosen
 * school. Tokens are stored under a public-write, admin-read Firestore path
 * (`schools/{schoolId}/subscribers/{token}`) so the admin sender can target
 * every interested device. Everything degrades quietly when FCM is unavailable
 * (unsupported browser, permission denied, or Firebase not configured).
 */

const GameDayNotifications = (function () {
  const VAPID_KEY = (window.GAMEDAY_FCM_VAPID_KEY || '').trim();
  const STORAGE_KEY = 'gameday_push_optin';
  const utils = window.GameDayUtils || {};

  function firebaseClient() { return window.GameDayFirebase || null; }

  function messagingSupported() {
    return typeof window !== 'undefined'
      && 'serviceWorker' in navigator
      && 'Notification' in window
      && 'PushManager' in window
      && typeof firebase !== 'undefined'
      && firebase.messaging;
  }

  function isConfigured() {
    const client = firebaseClient();
    return Boolean(client && client.isConfigured && client.isConfigured());
  }

  function currentSchoolId() {
    const client = firebaseClient();
    return (client && client.schoolId) || 'sugar-salem';
  }

  function permissionState() {
    if (typeof Notification === 'undefined') return 'unsupported';
    return Notification.permission;
  }

  function hasOptedIn() {
    try { return localStorage.getItem(STORAGE_KEY) === 'true'; } catch (_) { return false; }
  }

  function setOptedIn(value) {
    try { localStorage.setItem(STORAGE_KEY, value ? 'true' : 'false'); } catch (_) {}
  }

  async function registerToken() {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    await navigator.serviceWorker.ready;
    const token = await firebase.messaging().getToken({
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });
    return token;
  }

  // Persist the token so the admin sender can reach this device. Written with the
  // token as the document id so re-subscribing is idempotent.
  async function saveToken(token) {
    const client = firebaseClient();
    if (!client || !isConfigured() || !token) return false;
    try {
      await client.resources('subscribers').doc(token).set({
        token,
        schoolId: currentSchoolId(),
        userAgent: (navigator.userAgent || '').slice(0, 200),
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        active: true
      }, { merge: true });
      return true;
    } catch (err) {
      console.warn('Could not save push subscription:', err);
      return false;
    }
  }

  // Foreground messages (page open and focused) do not reach the service worker,
  // so show a real notification here plus an in-page toast. Attached once on load
  // so an already-opted-in tab still displays pushes without re-tapping the bell.
  let foregroundBound = false;
  function bindForeground() {
    if (foregroundBound || !messagingSupported()) return;
    try {
      firebase.messaging().onMessage(payload => {
        foregroundBound = true;
        const notification = (payload && payload.notification) || {};
        const data = (payload && payload.data) || {};
        const title = notification.title || data.title || 'GameDay+ update';
        const body = notification.body || data.body || 'There is a change to your schedule.';
        window.dispatchEvent(new CustomEvent('gameday:push', { detail: payload }));
        if (window.GameDayApp && typeof window.GameDayApp.showToast === 'function') {
          window.GameDayApp.showToast(`${title}: ${body}`, 'info');
        }
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          try {
            new Notification(title, {
              body,
              icon: '/assets/img/icon-192.png',
              badge: '/assets/img/icon-192.png',
              tag: data.tag || 'gameday-update'
            });
          } catch (_) {}
        }
      });
      foregroundBound = true;
    } catch (err) {
      console.warn('Could not attach foreground push handler:', err);
    }
  }

  async function enable() {
    if (!isConfigured() || !messagingSupported()) {
      return { ok: false, reason: 'unsupported' };
    }
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      setOptedIn(false);
      return { ok: false, reason: 'denied' };
    }
    try {
      const token = await registerToken();
      const saved = await saveToken(token);
      setOptedIn(saved);
      if (saved) {
        bindForeground();
      }
      return { ok: saved, reason: saved ? 'enabled' : 'save-failed' };
    } catch (err) {
      console.warn('Push registration failed:', err);
      setOptedIn(false);
      return { ok: false, reason: 'error', error: err };
    }
  }

  async function disable() {
    setOptedIn(false);
    try {
      if (messagingSupported()) {
        const token = await firebase.messaging().getToken({ vapidKey: VAPID_KEY });
        if (token) {
          const client = firebaseClient();
          if (client && isConfigured()) {
            await client.resources('subscribers').doc(token).set({ active: false }, { merge: true });
          }
          await firebase.messaging().deleteToken({ vapidKey: VAPID_KEY });
        }
      }
    } catch (err) {
      console.warn('Could not fully unsubscribe push:', err);
    }
    return { ok: true };
  }

  async function toggle() {
    if (hasOptedIn()) return disable();
    return enable();
  }

  function statusLabel() {
    if (!messagingSupported()) return 'Not supported on this device';
    if (permissionState() === 'denied') return 'Notifications blocked in browser settings';
    return hasOptedIn() ? 'Game alerts on' : 'Get game alerts';
  }

  function init() {
    if (messagingSupported() && permissionState() === 'granted' && hasOptedIn()) {
      bindForeground();
    }
  }

  return {
    messagingSupported,
    isConfigured,
    permissionState,
    hasOptedIn,
    enable,
    disable,
    toggle,
    statusLabel,
    init,
    VAPID_KEY
  };
})();

window.GameDayNotifications = GameDayNotifications;
