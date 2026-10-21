'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const schema = require('../../assets/js/event-schema.js');
const {
  SEASON,
  SCHOOLS,
  generateEventsForSchool,
  planEventWrites,
  deterministicScore,
  clampDay,
  applySeason
} = require('../../services/seed-all-schools.js');

const SCHOOL = SCHOOLS[0];

test('deterministic scores are stable for the same seed', () => {
  assert.equal(deterministicScore('sugar-salem-sc-b-1', 1, 4), deterministicScore('sugar-salem-sc-b-1', 1, 4));
  assert.ok(deterministicScore('seed-a', 1, 4) >= 1);
  assert.ok(deterministicScore('seed-a', 1, 4) <= 4);
});

test('different seeds produce different scores', () => {
  const values = new Set();
  for (let i = 0; i < 20; i += 1) values.add(deterministicScore(`seed-${i}`, 1, 4));
  assert.ok(values.size > 1);
});

test('clampDay keeps a date inside the month', () => {
  assert.equal(clampDay(2026, 9, 32), 30);
  assert.equal(clampDay(2026, 9, 15), 15);
  assert.equal(clampDay(2026, 2, 31), 28);
});

test('applySeason moves a date into the configured season year', () => {
  const shifted = applySeason({ date: '2026-08-28', ourScore: 10, oppScore: 3, homeScore: 10, awayScore: 3, status: 'Final' });
  assert.equal(shifted.date, `${SEASON.year}-08-28`);
});

test('applySeason drops the result of a game that is still in the future', () => {
  const future = applySeason({ date: '2026-12-25', ourScore: 10, oppScore: 3, homeScore: 10, awayScore: 3, status: 'Final' });
  assert.equal(future.ourScore, null);
  assert.equal(future.oppScore, null);
  assert.equal(future.status, 'Scheduled');
});

test('generated events have unique ids and valid dates', () => {
  const events = generateEventsForSchool(SCHOOL);
  const ids = new Set(events.map(event => event.id));
  assert.equal(ids.size, events.length);

  events.forEach(event => {
    assert.match(event.date, /^\d{4}-\d{2}-\d{2}$/);
    const [year, month, day] = event.date.split('-').map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, day));
    assert.equal(parsed.getUTCMonth(), month - 1);
    assert.equal(parsed.getUTCDate(), day);
  });
});

test('a new event is created with a canonical external key', () => {
  const events = generateEventsForSchool(SCHOOL);
  const plan = planEventWrites(SCHOOL, [events[0]], [], '2026-01-01T00:00:00.000Z');

  assert.equal(plan.summary.created, 1);
  assert.equal(plan.writes.length, 1);
  assert.equal(plan.writes[0].fields.externalKey, schema.buildExternalKey(SCHOOL.id, 'seed', events[0].id));
  assert.equal(plan.writes[0].path, `schools/${SCHOOL.id}/events/${events[0].id}`);
});

test('an existing event is matched by content and updated, not duplicated', () => {
  const events = generateEventsForSchool(SCHOOL);
  const event = events[0];
  const existing = [{
    id: 'legacy-doc-id',
    data: {
      id: 'a-different-id',
      schoolId: SCHOOL.id,
      sport: event.sport,
      gender: event.gender,
      date: event.date,
      opponent: event.opponent,
      ourScore: 21,
      oppScore: 14,
      scoresVerified: true
    }
  }];

  const plan = planEventWrites(SCHOOL, [event], existing, '2026-01-01T00:00:00.000Z');

  assert.equal(plan.summary.updated, 1);
  assert.equal(plan.summary.created, 0);
  assert.equal(plan.writes[0].path, `schools/${SCHOOL.id}/events/legacy-doc-id`);
  assert.equal(plan.writes[0].fields.externalKey, schema.buildExternalKey(SCHOOL.id, 'seed', event.id));
});

test('an update never writes admin-owned score fields', () => {
  const events = generateEventsForSchool(SCHOOL);
  const event = events[0];
  const existing = [{
    id: 'legacy-doc-id',
    data: {
      schoolId: SCHOOL.id,
      sport: event.sport,
      gender: event.gender,
      date: event.date,
      opponent: event.opponent,
      ourScore: 21,
      oppScore: 14,
      stats: { possession: 55 },
      scoresVerified: true,
      statsVerified: true
    }
  }];

  const plan = planEventWrites(SCHOOL, [event], existing, '2026-01-01T00:00:00.000Z');
  const fields = plan.writes[0].fields;

  assert.ok(!('ourScore' in fields));
  assert.ok(!('oppScore' in fields));
  assert.ok(!('stats' in fields));
  assert.ok(!('scoresVerified' in fields));
});

test('a manually overridden event is left completely alone', () => {
  const events = generateEventsForSchool(SCHOOL);
  const event = events[0];
  const existing = [{
    id: 'locked-doc-id',
    data: {
      schoolId: SCHOOL.id,
      sport: event.sport,
      gender: event.gender,
      date: event.date,
      opponent: event.opponent,
      manualOverride: true
    }
  }];

  const plan = planEventWrites(SCHOOL, [event], existing, '2026-01-01T00:00:00.000Z');

  assert.equal(plan.summary.skipped, 1);
  assert.equal(plan.writes.length, 0);
});

test('an unchanged event produces no write at all', () => {
  const events = generateEventsForSchool(SCHOOL);
  const event = events[0];
  const externalKey = schema.buildExternalKey(SCHOOL.id, 'seed', event.id);
  const existing = [{
    id: event.id,
    data: {
      id: event.id,
      externalKey,
      source: 'seed',
      sourceId: event.id,
      schemaVersion: schema.SCHEMA_VERSION,
      syncOwner: 'seed',
      manualOverride: false,
      scoresVerified: false,
      statsVerified: false,
      ...event
    }
  }];

  const plan = planEventWrites(SCHOOL, [event], existing, '2026-01-01T00:00:00.000Z');

  assert.equal(plan.summary.unchanged, 1);
  assert.equal(plan.writes.length, 0);
});
