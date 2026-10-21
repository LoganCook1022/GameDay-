'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const schema = require('../../assets/js/event-schema.js');

const ADMIN_STATE = {
  ourScore: 21,
  oppScore: 14,
  stats: { possession: 55 },
  manualOverride: true,
  scoresVerified: true,
  statsVerified: true
};

test('buildExternalKey produces the canonical schoolId:source:sourceId shape', () => {
  assert.equal(
    schema.buildExternalKey('sugar-salem', 'ics', 'uid-123'),
    'sugar-salem:ics:uid-123'
  );
});

test('buildExternalKey escapes separators so the key always has three parts', () => {
  const key = schema.buildExternalKey('sugar-salem', 'ics', 'a:b/c');
  assert.equal(key.split(':').length, 3);
  assert.equal(schema.parseExternalKey(key).sourceId, 'a:b/c');
});

test('parseExternalKey rejects malformed keys', () => {
  assert.equal(schema.parseExternalKey('sugar-salem:ics'), null);
  assert.equal(schema.parseExternalKey('sugar-salem:ics:'), null);
  assert.equal(schema.parseExternalKey(null), null);
});

test('parseExternalKey round-trips a built key', () => {
  const key = schema.buildExternalKey('teton', 'local', 'evt-001');
  assert.deepEqual(schema.parseExternalKey(key), {
    schoolId: 'teton',
    source: 'local',
    sourceId: 'evt-001'
  });
});

test('normalizeExternalKey migrates the legacy local: prefix', () => {
  assert.equal(
    schema.normalizeExternalKey('local:evt-001', { schoolId: 'sugar-salem' }),
    'sugar-salem:local:evt-001'
  );
});

test('normalizeExternalKey migrates the legacy ics: prefix', () => {
  assert.equal(
    schema.normalizeExternalKey('ics:uid-9', { schoolId: 'teton' }),
    'teton:ics:uid-9'
  );
});

test('normalizeExternalKey migrates the two-part schoolId:id legacy key', () => {
  assert.equal(
    schema.normalizeExternalKey('sugar-salem:evt-042', {
      schoolId: 'sugar-salem',
      source: 'seed',
      sourceId: 'evt-042'
    }),
    'sugar-salem:seed:evt-042'
  );
});

test('normalizeExternalKey keeps an already-canonical key stable', () => {
  const key = schema.buildExternalKey('sugar-salem', 'ics', 'uid-3');
  assert.equal(schema.normalizeExternalKey(key, { schoolId: 'madison' }), key);
});

test('normalizeExternalKey builds a key when none is supplied', () => {
  assert.equal(
    schema.normalizeExternalKey(undefined, {
      schoolId: 'madison',
      source: 'local',
      sourceId: 'evt-9'
    }),
    'madison:local:evt-9'
  );
});

test('docIdForExternalKey is deterministic and Firestore-safe', () => {
  const key = schema.buildExternalKey('sugar-salem', 'ics', 'uid-123');
  const docId = schema.docIdForExternalKey(key);
  assert.equal(docId, schema.docIdForExternalKey(key));
  assert.ok(!docId.includes('/'));
  assert.ok(!docId.includes(':'));
  assert.ok(!docId.startsWith('__'));
});

test('sync merge refreshes schedule fields', () => {
  const existing = { id: 'evt-1', sport: 'Basketball', time: '6:00 PM', opponent: 'Old' };
  const incoming = { sport: 'Basketball', time: '7:00 PM', opponent: 'New' };

  const result = schema.mergeEvent(existing, incoming, { source: 'sync' });

  assert.equal(result.skipped, null);
  assert.equal(result.data.time, '7:00 PM');
  assert.equal(result.data.opponent, 'New');
  assert.equal(result.changed, true);
});

test('sync merge never clobbers admin-owned scores or stats', () => {
  const existing = { id: 'evt-1', ourScore: 21, oppScore: 14, stats: { possession: 55 } };
  const incoming = { ourScore: 0, oppScore: 0, stats: null, time: '7:00 PM' };

  const result = schema.mergeEvent(existing, incoming, { source: 'sync' });

  assert.equal(result.data.ourScore, 21);
  assert.equal(result.data.oppScore, 14);
  assert.deepEqual(result.data.stats, { possession: 55 });
  assert.equal(result.data.time, '7:00 PM');
});

test('sync merge never resets the verification flags', () => {
  const existing = { id: 'evt-1', scoresVerified: true, statsVerified: true, manualOverride: false };
  const incoming = { scoresVerified: false, statsVerified: false, manualOverride: false };

  const result = schema.mergeEvent(existing, incoming, { source: 'sync' });

  assert.equal(result.data.scoresVerified, true);
  assert.equal(result.data.statsVerified, true);
});

test('sync merge leaves a manually overridden event untouched', () => {
  const existing = { id: 'evt-1', manualOverride: true, opponent: 'Manual', time: '6:00 PM' };
  const incoming = { opponent: 'Feed', time: '9:00 PM' };

  const result = schema.mergeEvent(existing, incoming, { source: 'sync' });

  assert.equal(result.skipped, 'manual-override');
  assert.equal(result.changed, false);
  assert.deepEqual(result.changedFields, []);
  assert.equal(result.data.opponent, 'Manual');
  assert.equal(result.data.time, '6:00 PM');
});

test('admin merge is authoritative for the fields it sends', () => {
  const existing = { id: 'evt-1', opponent: 'Feed', ourScore: null };
  const incoming = { opponent: 'Manual', ourScore: 21, manualOverride: true, scoresVerified: true };

  const result = schema.mergeEvent(existing, incoming, { source: 'admin' });

  assert.equal(result.data.opponent, 'Manual');
  assert.equal(result.data.ourScore, 21);
  assert.equal(result.data.manualOverride, true);
  assert.equal(result.data.scoresVerified, true);
});

test('merge reports no change when the incoming content is identical', () => {
  const existing = { id: 'evt-1', opponent: 'Same', time: '6:00 PM' };
  const incoming = { opponent: 'Same', time: '6:00 PM' };

  const result = schema.mergeEvent(existing, incoming, { source: 'sync' });

  assert.equal(result.changed, false);
  assert.deepEqual(result.changedFields, []);
});

test('merge never invents an updatedAt, so the caller can detect real changes', () => {
  const existing = { id: 'evt-1', updatedAt: 1700000000, opponent: 'Same' };
  const incoming = { opponent: 'Same' };

  const result = schema.mergeEvent(existing, incoming, { source: 'sync' });

  assert.equal(result.changed, false);
  assert.equal(result.data.updatedAt, 1700000000);
  assert.ok(!('updatedAt' in result.changedFields));
});

test('merge seeds admin-owned fields on first write only', () => {
  const incoming = { ourScore: 7, oppScore: 3, stats: null, manualOverride: false, scoresVerified: false };

  const created = schema.mergeEvent(undefined, incoming, { source: 'sync' });
  assert.equal(created.data.ourScore, 7);

  const updated = schema.mergeEvent(created.data, incoming, { source: 'sync' });
  assert.equal(updated.data.ourScore, 7);
  assert.equal(updated.changed, false);
});

test('merge keeps the canonical externalKey it was given', () => {
  const key = schema.buildExternalKey('sugar-salem', 'ics', 'uid-5');
  const result = schema.mergeEvent({}, { externalKey: key, opponent: 'X' }, { source: 'sync' });
  assert.equal(result.data.externalKey, key);
});

test('field ownership lists do not overlap', () => {
  const overlap = schema.SYNC_OWNED_FIELDS.filter(field => schema.ADMIN_OWNED_FIELDS.indexOf(field) !== -1);
  assert.deepEqual(overlap, []);
});

test('stripUndefined removes keys with undefined values', () => {
  assert.deepEqual(schema.stripUndefined({ a: 1, b: undefined, c: null }), { a: 1, c: null });
});

test('contentKey ignores casing and whitespace', () => {
  const a = schema.contentKey({ schoolId: 'Sugar-Salem', sport: ' Football ', gender: 'Boys', date: '2026-08-28', opponent: 'South Fremont' });
  const b = schema.contentKey({ schoolId: 'sugar-salem', sport: 'football', gender: 'boys', date: '2026-08-28', opponent: 'south fremont' });
  assert.equal(a, b);
});

test('contentKey separates events that differ in any field', () => {
  const base = { schoolId: 'sugar-salem', sport: 'Football', gender: 'Boys', date: '2026-08-28', opponent: 'South Fremont' };
  assert.notEqual(schema.contentKey(base), schema.contentKey({ ...base, date: '2026-08-29' }));
  assert.notEqual(schema.contentKey(base), schema.contentKey({ ...base, opponent: 'Teton' }));
});

test('findMatchingEvent prefers the external key over anything else', () => {
  const entries = [
    { id: 'doc-a', data: { externalKey: 'sugar-salem:seed:x', sport: 'Football' } },
    { id: 'doc-b', data: { id: 'evt-1', sport: 'Football' } }
  ];
  const match = schema.findMatchingEvent(entries, { externalKey: 'sugar-salem:seed:x', docId: 'evt-1' });
  assert.equal(match.id, 'doc-a');
});

test('findMatchingEvent falls back to the document id', () => {
  const entries = [
    { id: 'doc-a', data: { sport: 'Football' } },
    { id: 'doc-b', data: { id: 'evt-1', sport: 'Football' } }
  ];
  const match = schema.findMatchingEvent(entries, { externalKey: 'missing', docId: 'evt-1' });
  assert.equal(match.id, 'doc-b');
});

test('findMatchingEvent falls back to the content signature', () => {
  const entries = [
    { id: 'doc-a', data: { schoolId: 'sugar-salem', sport: 'Football', gender: 'Boys', date: '2026-08-28', opponent: 'South Fremont' } }
  ];
  const match = schema.findMatchingEvent(entries, {
    externalKey: 'missing',
    docId: 'unrelated',
    contentKey: schema.contentKey({ schoolId: 'sugar-salem', sport: 'Football', gender: 'Boys', date: '2026-08-28', opponent: 'South Fremont' })
  });
  assert.equal(match.id, 'doc-a');
});

test('findMatchingEvent returns null when nothing matches', () => {
  assert.equal(schema.findMatchingEvent([{ id: 'a', data: {} }], { externalKey: 'nope' }), null);
});

test('defaultVerificationState starts every event unverified', () => {
  assert.deepEqual(schema.defaultVerificationState(), {
    manualOverride: false,
    scoresVerified: false,
    statsVerified: false
  });
});
