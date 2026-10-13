'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const GameDayCredentials = require('../../assets/js/credentials.js');

function memoryStorage(seed = {}) {
  const map = new Map(Object.entries(seed));
  return {
    getItem: key => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => { map.set(key, String(value)); },
    removeItem: key => { map.delete(key); },
    _dump: () => Object.fromEntries(map)
  };
}

test('passwords are never persisted to storage', () => {
  const storage = memoryStorage();
  GameDayCredentials.rememberEmail('Admin@School.org', true, storage);

  const raw = storage._dump();
  const serialized = JSON.stringify(raw);
  assert.ok(!/password/i.test(Object.keys(raw).join(',')), 'no password-like storage keys');
  assert.ok(!serialized.includes('password'), 'stored JSON has no password field');

  const store = GameDayCredentials.getStore(storage);
  assert.equal(store.accounts['admin@school.org'].email, 'Admin@School.org');
  assert.equal(store.accounts['admin@school.org'].password, undefined);
});

test('legacy plaintext password keys are purged', () => {
  const storage = memoryStorage({
    gameday_remember_password: 'hunter2',
    gameday_remember_email: 'legacy@school.org',
    gameday_remember_me: 'true'
  });

  GameDayCredentials.sanitize(storage);

  const dump = storage._dump();
  assert.equal(dump.gameday_remember_password, undefined, 'legacy password key removed');
  const store = GameDayCredentials.getStore(storage);
  assert.equal(store.accounts['legacy@school.org'].email, 'legacy@school.org');
});

test('a leftover password field in the store is stripped on load', () => {
  const storage = memoryStorage({
    gameday_saved_credentials: JSON.stringify({
      remember: true,
      lastUsed: 'x@y.org',
      accounts: { 'x@y.org': { email: 'x@y.org', password: 'secret' } }
    })
  });

  const store = GameDayCredentials.getStore(storage);
  assert.equal(store.accounts['x@y.org'].password, undefined);

  GameDayCredentials.saveStore(store, storage);
  assert.ok(!storage.getItem('gameday_saved_credentials').includes('secret'));
});

test('rememberEmail respects the shouldRemember flag', () => {
  const storage = memoryStorage();
  GameDayCredentials.rememberEmail('a@b.org', true, storage);
  assert.equal(GameDayCredentials.getActiveAccount(GameDayCredentials.getStore(storage)).email, 'a@b.org');

  GameDayCredentials.rememberEmail('a@b.org', false, storage);
  const store = GameDayCredentials.getStore(storage);
  assert.equal(store.accounts['a@b.org'], undefined);
  assert.equal(store.remember, false);
});

test('forget removes a single account and repoints lastUsed', () => {
  const storage = memoryStorage();
  GameDayCredentials.rememberEmail('a@b.org', true, storage);
  GameDayCredentials.rememberEmail('c@d.org', true, storage);
  GameDayCredentials.forget('c@d.org', storage);

  const store = GameDayCredentials.getStore(storage);
  assert.equal(store.accounts['c@d.org'], undefined);
  assert.equal(store.lastUsed, 'a@b.org');
});

test('setRemember(false) clears saved accounts', () => {
  const storage = memoryStorage();
  GameDayCredentials.rememberEmail('a@b.org', true, storage);
  GameDayCredentials.setRemember(false, storage);

  const store = GameDayCredentials.getStore(storage);
  assert.deepEqual(store.accounts, {});
  assert.equal(store.remember, false);
});

test('getStore tolerates corrupt JSON', () => {
  const storage = memoryStorage({ gameday_saved_credentials: '{not json' });
  const store = GameDayCredentials.getStore(storage);
  assert.deepEqual(store.accounts, {});
  assert.equal(store.remember, true);
});
