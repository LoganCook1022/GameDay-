'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const ai = require('../../services/generate-description.js');

test('buildPrompt includes only the provided event facts', () => {
  const prompt = ai.buildPrompt({
    eventName: 'Varsity Football vs Panthers',
    sport: 'Football',
    opponent: 'Snake River',
    date: '2026-10-24',
    locationType: 'Home'
  });
  assert.match(prompt, /Varsity Football vs Panthers/);
  assert.match(prompt, /Sport: Football/);
  assert.match(prompt, /Opponent: Snake River/);
  assert.match(prompt, /Date: 2026-10-24/);
  assert.match(prompt, /Home\/Away: Home/);
  assert.doesNotMatch(prompt, /undefined/);
});
test('buildPrompt omits blank and missing fields', () => {
  const prompt = ai.buildPrompt({ eventName: 'Basketball', sport: '  ', opponent: '' });
  assert.match(prompt, /Event: Basketball/);
  assert.doesNotMatch(prompt, /Sport:/);
  assert.doesNotMatch(prompt, /Opponent:/);
});

test('buildPrompt tells the model not to invent facts', () => {
  const prompt = ai.buildPrompt({ eventName: 'Soccer' });
  assert.match(prompt, /Do not invent/i);
});

test('buildPrompt handles a missing event object', () => {
  const prompt = ai.buildPrompt();
  assert.match(prompt, /no details provided/);
});

test('buildPrompt prefers eventName but falls back to title', () => {
  assert.match(ai.buildPrompt({ title: 'Track Meet' }), /Event: Track Meet/);
  assert.match(ai.buildPrompt({ eventName: 'Volleyball', title: 'Ignored' }), /Event: Volleyball/);
});

test('resolveProvider returns the known providers with their config', () => {
  const groq = ai.resolveProvider('groq');
  assert.equal(groq.baseUrl, 'https://api.groq.com/openai/v1/chat/completions');
  assert.equal(groq.keyEnv, 'GROQ_API_KEY');
  // Groq deprecates models on a schedule; keep this pointed at a current one.
  assert.equal(groq.defaultModel, 'openai/gpt-oss-120b');

  const openrouter = ai.resolveProvider('openrouter');
  assert.equal(openrouter.baseUrl, 'https://openrouter.ai/api/v1/chat/completions');
  assert.equal(openrouter.keyEnv, 'OPENROUTER_API_KEY');
});

test('resolveProvider is case-insensitive and trims whitespace', () => {
  assert.equal(ai.resolveProvider('  GROQ  ').name, 'groq');
  assert.equal(ai.resolveProvider('OpenRouter').name, 'openrouter');
});

test('resolveProvider rejects an unknown provider with a helpful message', () => {
  assert.throws(() => ai.resolveProvider('gemini'), /Unknown AI provider/);
  assert.throws(() => ai.resolveProvider('gemini'), /groq, openrouter/);
});

test('callModel fails with a setup hint when the provider key is missing', async () => {
  const previous = process.env.GROQ_API_KEY;
  delete process.env.GROQ_API_KEY;
  try {
    await assert.rejects(
      () => ai.callModel({ eventName: 'Soccer' }, 'groq'),
      err => err.statusCode === 503 && /GROQ_API_KEY/.test(err.message)
    );
  } finally {
    if (previous !== undefined) process.env.GROQ_API_KEY = previous;
  }
});
