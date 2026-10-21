'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const schema = require('../../assets/js/event-schema.js');
const { mapEventToWebsitePayload, upsertGame, upsertLocation, syncState } = require('../../services/ical-sync.js');

function resetRuntime(client) {
  syncState.client = client || { listDocs: async () => [], commit: async () => ({}) };
  syncState.dryRun = false;
  syncState.schoolId = 'sugar-salem';
  syncState.eventIndex = new Map();
  syncState.locationIndex = new Map();
  syncState.pendingWrites = [];
  syncState.summary = { created: 0, updated: 0, unchanged: 0, skipped: 0 };
  syncState.now = '2026-01-01T00:00:00.000Z';
}

const FEED_ROW = {
  ical_uid: 'feed-uid-1',
  title: 'Varsity Football vs South Fremont',
  opponent: 'South Fremont High School',
  start_at: '2026-09-04T19:00:00.000Z',
  venue_name: 'Sugar-Salem High School Stadium',
  venue_address: '#1 Digger Dr, Sugar City, ID 83448',
  status: 'scheduled',
  raw_summary: 'Varsity Football vs South Fremont'
};

test('feed payload uses the canonical external key', () => {
  const payload = mapEventToWebsitePayload(FEED_ROW, { schoolId: 'sugar-salem' });
  assert.equal(payload.externalKey, 'sugar-salem:ics:feed-uid-1');
  assert.equal(payload.source, 'ics');
  assert.equal(payload.sourceId, 'feed-uid-1');
});

test('feed payload never carries admin-owned fields', () => {
  const payload = mapEventToWebsitePayload(FEED_ROW, { schoolId: 'sugar-salem' });
  ['ourScore', 'oppScore', 'homeScore', 'awayScore', 'stats', 'manualOverride', 'scoresVerified', 'statsVerified']
    .forEach(field => assert.ok(!(field in payload), `${field} must not be in a feed payload`));
});

test('a new feed event is created without touching score fields', async () => {
  resetRuntime();
  const result = await upsertGame(FEED_ROW);

  assert.equal(result.status, 'created');
  assert.equal(syncState.pendingWrites.length, 1);

  const write = syncState.pendingWrites[0];
  assert.ok(write.path.startsWith('schools/sugar-salem/events/'));
  assert.equal(write.fields.externalKey, 'sugar-salem:ics:feed-uid-1');
  assert.ok(!('ourScore' in write.fields));
  assert.ok(!('stats' in write.fields));
  assert.ok(!('manualOverride' in write.fields));
});

test('an existing verified score survives a feed refresh', async () => {
  resetRuntime();
  const existing = {
    externalKey: 'sugar-salem:ics:feed-uid-1',
    opponent: 'Old Opponent',
    ourScore: 21,
    oppScore: 14,
    stats: { possession: 55 },
    scoresVerified: true,
    manualOverride: false
  };
  syncState.eventIndex.set(existing.externalKey, { id: 'legacy-doc-id', data: existing });

  const result = await upsertGame({ ...FEED_ROW, opponent: 'New Opponent' });

  assert.equal(result.status, 'updated');
  const write = syncState.pendingWrites[0];
  assert.equal(write.path, 'schools/sugar-salem/events/legacy-doc-id');
  assert.equal(write.fields.opponent, 'New Opponent');
  assert.ok(!('ourScore' in write.fields));
  assert.ok(!('oppScore' in write.fields));
  assert.ok(!('stats' in write.fields));
  assert.ok(!('scoresVerified' in write.fields));
});

test('an unchanged feed event is not written again', async () => {
  resetRuntime();
  const payload = mapEventToWebsitePayload(FEED_ROW, { schoolId: 'sugar-salem' });
  syncState.eventIndex.set(payload.externalKey, { id: 'doc-1', data: { ...payload } });

  const result = await upsertGame(FEED_ROW);

  assert.equal(result.status, 'unchanged');
  assert.equal(syncState.pendingWrites.length, 0);
});

test('a manually overridden event is skipped entirely', async () => {
  resetRuntime();
  const existing = {
    externalKey: 'sugar-salem:ics:feed-uid-1',
    opponent: 'Manual Opponent',
    manualOverride: true
  };
  syncState.eventIndex.set(existing.externalKey, { id: 'doc-1', data: existing });

  const result = await upsertGame({ ...FEED_ROW, opponent: 'Feed Opponent' });

  assert.equal(result.status, 'skipped');
  assert.equal(result.reason, 'manual-override');
  assert.equal(syncState.pendingWrites.length, 0);
});

test('a legacy document without an external key is matched by its id field', async () => {
  resetRuntime();
  syncState.eventIndex.set('id:feed-uid-1', { id: 'legacy-1', data: { id: 'feed-uid-1', opponent: 'Legacy' } });

  const result = await upsertGame(FEED_ROW);

  assert.equal(result.status, 'updated');
  assert.equal(syncState.pendingWrites[0].path, 'schools/sugar-salem/events/legacy-1');
  assert.equal(syncState.pendingWrites[0].fields.externalKey, 'sugar-salem:ics:feed-uid-1');
});

test('locations are upserted under the school with a stable key', async () => {
  resetRuntime();
  const result = await upsertLocation({
    location_name: 'Sugar-Salem High School Stadium',
    address: '#1 Digger Dr, Sugar City, ID 83448',
    latitude: 43.8744,
    longitude: -111.7483,
    source: 'ical-sync'
  });

  assert.equal(result.status, 'created');
  assert.equal(syncState.pendingWrites.length, 1);
  assert.ok(syncState.pendingWrites[0].path.startsWith('schools/sugar-salem/locations/'));
  assert.equal(syncState.pendingWrites[0].fields.lat, 43.8744);
});

test('the schema and the feed agree on the external key format', () => {
  const payload = mapEventToWebsitePayload(FEED_ROW, { schoolId: 'teton' });
  assert.equal(payload.externalKey, schema.buildExternalKey('teton', 'ics', 'feed-uid-1'));
});
