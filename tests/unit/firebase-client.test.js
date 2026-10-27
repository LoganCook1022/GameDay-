'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const GameDayUtils = require('../../assets/js/utils.js');

const firebaseClientSource = fs.readFileSync(
  path.join(__dirname, '../../assets/js/firebase-client.js'),
  'utf8'
);

function createClient(school = 'sugar-salem') {
  const dom = new JSDOM('', {
    url: `https://example.test/?school=${school}`,
    runScripts: 'outside-only'
  });
  dom.window.GameDayUtils = GameDayUtils;
  dom.window.eval(firebaseClientSource);
  return { client: dom.window.GameDayFirebase, dom };
}

test('Firebase normalization does not pin away venues to the home school', () => {
  const { client, dom } = createClient();
  const awayEvent = client.normalizeEvent('away-game', {
    locationType: 'Away',
    venueName: 'Opponent Stadium'
  });

  assert.equal(awayEvent.lat, null);
  assert.equal(awayEvent.lng, null);
  dom.window.close();
});

test('Firebase normalization uses the selected school coordinates for home venues only', () => {
  const { client, dom } = createClient('teton');
  const homeEvent = client.normalizeEvent('home-game', { locationType: 'Home' });
  const awayEvent = client.normalizeEvent('away-game', {
    locationType: 'Away',
    lat: 999,
    lng: -111
  });

  assert.equal(homeEvent.lat, 43.7225);
  assert.equal(homeEvent.lng, -111.1033);
  assert.equal(awayEvent.lat, null);
  assert.equal(awayEvent.lng, -111);
  dom.window.close();
});
