/**
 * GameDay+ - Saved-account credential store
 *
 * Centralizes the "remember me" logic previously duplicated in admin.js and
 * signin.js. IMPORTANT: passwords are NEVER persisted. Only the email address is
 * remembered (keyed lowercase) so the sign-in forms can pre-fill it and offer
 * one-tap account switching.
 *
 * Legacy keys from older builds (gameday_remember_password) are actively purged
 * by sanitize(), and any `password` field left inside gameday_saved_credentials
 * by a previous version is stripped on load.
 *
 * Exported for Node unit tests; accepts an injectable storage object.
 */

const GameDayCredentials = (function () {
  const STORAGE_KEY = 'gameday_saved_credentials';
  const LEGACY_EMAIL_KEY = 'gameday_remember_email';
  const LEGACY_PASS_KEY = 'gameday_remember_password';
  const LEGACY_REMEMBER_KEY = 'gameday_remember_me';

  function resolveStorage(storage) {
    if (storage) return storage;
    if (typeof localStorage !== 'undefined') return localStorage;
    return null;
  }

  function emptyStore() {
    return { remember: true, lastUsed: '', accounts: {} };
  }

  function stripPasswords(store) {
    if (!store || typeof store !== 'object') return emptyStore();
    if (!store.accounts || typeof store.accounts !== 'object') store.accounts = {};
    Object.keys(store.accounts).forEach(key => {
      const account = store.accounts[key];
      if (!account || typeof account !== 'object') {
        delete store.accounts[key];
        return;
      }
      if ('password' in account) delete account.password;
      if (!account.email) delete store.accounts[key];
    });
    if (typeof store.remember !== 'boolean') store.remember = true;
    if (typeof store.lastUsed !== 'string') store.lastUsed = '';
    return store;
  }

  function getStore(storage) {
    const store = resolveStorage(storage);
    if (!store) return emptyStore();
    try {
      const raw = store.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') return stripPasswords(parsed);
      }
    } catch (_) { /* fall through to legacy migration */ }

    const legacyEmail = store.getItem(LEGACY_EMAIL_KEY);
    const legacyRemember = store.getItem(LEGACY_REMEMBER_KEY) !== 'false';
    const migrated = emptyStore();
    migrated.remember = legacyRemember;
    if (legacyEmail) {
      const key = legacyEmail.trim().toLowerCase();
      migrated.lastUsed = key;
      migrated.accounts[key] = { email: legacyEmail.trim(), savedAt: Date.now() };
    }
    return migrated;
  }

  function saveStore(store, storage) {
    const target = resolveStorage(storage);
    if (!target) return store;
    const clean = stripPasswords(store);
    try {
      target.setItem(STORAGE_KEY, JSON.stringify(clean));
      target.setItem(LEGACY_REMEMBER_KEY, clean.remember ? 'true' : 'false');
      if (clean.remember && clean.lastUsed && clean.accounts[clean.lastUsed]) {
        target.setItem(LEGACY_EMAIL_KEY, clean.accounts[clean.lastUsed].email);
      } else {
        target.removeItem(LEGACY_EMAIL_KEY);
      }
      // Never keep a stored password, under any key.
      target.removeItem(LEGACY_PASS_KEY);
    } catch (_) { /* storage unavailable (private mode); ignore */ }
    return clean;
  }

  function rememberEmail(email, shouldRemember, storage) {
    if (!email) return getStore(storage);
    const key = String(email).trim().toLowerCase();
    const store = getStore(storage);
    if (shouldRemember) {
      store.remember = true;
      store.lastUsed = key;
      store.accounts[key] = { email: String(email).trim(), savedAt: Date.now() };
    } else {
      store.remember = false;
      delete store.accounts[key];
      if (store.lastUsed === key) {
        const remaining = Object.keys(store.accounts);
        store.lastUsed = remaining.length ? remaining[0] : '';
      }
    }
    return saveStore(store, storage);
  }

  function forget(email, storage) {
    if (!email) return getStore(storage);
    const key = String(email).trim().toLowerCase();
    const store = getStore(storage);
    delete store.accounts[key];
    if (store.lastUsed === key) {
      const remaining = Object.keys(store.accounts);
      store.lastUsed = remaining.length ? remaining[0] : '';
    }
    return saveStore(store, storage);
  }

  function setRemember(remember, storage) {
    const store = getStore(storage);
    store.remember = Boolean(remember);
    if (!store.remember) store.accounts = {};
    return saveStore(store, storage);
  }

  function getActiveAccount(store) {
    if (!store || !store.accounts) return null;
    const keys = Object.keys(store.accounts);
    if (keys.length === 0) return null;
    const activeKey = (store.lastUsed && store.accounts[store.lastUsed]) ? store.lastUsed : keys[0];
    return store.accounts[activeKey] || null;
  }

  // One-time remediation: purge any plaintext password left by older builds.
  function sanitize(storage) {
    const target = resolveStorage(storage);
    if (!target) return;
    try { target.removeItem(LEGACY_PASS_KEY); } catch (_) { /* ignore */ }
    const store = getStore(target);
    saveStore(store, target);
  }

  return {
    STORAGE_KEY,
    LEGACY_EMAIL_KEY,
    LEGACY_PASS_KEY,
    LEGACY_REMEMBER_KEY,
    getStore,
    saveStore,
    rememberEmail,
    forget,
    setRemember,
    getActiveAccount,
    sanitize
  };
})();

if (typeof window !== 'undefined') window.GameDayCredentials = GameDayCredentials;
if (typeof module !== 'undefined' && module.exports) module.exports = GameDayCredentials;
