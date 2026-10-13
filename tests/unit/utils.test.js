'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const GameDayUtils = require('../../assets/js/utils.js');

test('escapeHtml escapes the five dangerous characters', () => {
  assert.equal(
    GameDayUtils.escapeHtml(`<img src=x onerror="alert('x')">&`),
    '&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt;&amp;'
  );
});

test('escapeHtml tolerates null/undefined/numbers', () => {
  assert.equal(GameDayUtils.escapeHtml(null), '');
  assert.equal(GameDayUtils.escapeHtml(undefined), '');
  assert.equal(GameDayUtils.escapeHtml(0), '0');
});

test('escapeAttr is equivalent to escapeHtml for double-quoted attributes', () => {
  const payload = `" onmouseover="steal()`;
  assert.equal(GameDayUtils.escapeAttr(payload), GameDayUtils.escapeHtml(payload));
  assert.ok(!GameDayUtils.escapeAttr(payload).includes('"'));
});

test('escapeQuotes escapes backslashes and single quotes', () => {
  assert.equal(GameDayUtils.escapeQuotes(`a'b\\c`), `a\\'b\\\\c`);
});

test('isKnownSchool only accepts canonical ids', () => {
  assert.equal(GameDayUtils.isKnownSchool('sugar-salem'), true);
  assert.equal(GameDayUtils.isKnownSchool('unknown'), false);
  assert.equal(GameDayUtils.isKnownSchool('../../etc'), false);
  assert.equal(GameDayUtils.isKnownSchool(undefined), false);
});

test('normalizeSchoolId returns fallback for unknown values', () => {
  assert.equal(GameDayUtils.normalizeSchoolId('teton'), 'teton');
  assert.equal(GameDayUtils.normalizeSchoolId('nope', 'sugar-salem'), 'sugar-salem');
  assert.equal(GameDayUtils.normalizeSchoolId(null), null);
  assert.equal(GameDayUtils.normalizeSchoolId('  madison  ', 'sugar-salem'), 'madison');
});

test('KNOWN_SCHOOL_IDS matches the six supported schools', () => {
  assert.deepEqual(GameDayUtils.KNOWN_SCHOOL_IDS, [
    'sugar-salem', 'south-fremont', 'teton', 'snake-river', 'madison', 'rigby'
  ]);
});
