'use strict';

require('dotenv').config();

/**
 * GameDay+ - AI event description generator (local service)
 *
 * A tiny HTTP endpoint the admin dashboard calls to draft an event description
 * with an OpenAI-compatible LLM API. It exists as a separate service so the API
 * key NEVER ships to the browser - the same security boundary we use for FCM
 * push (services/send-notifications.js).
 *
 * Why not Gemini? Our school Google Workspace account is blocked from Google AI
 * Studio, so no Gemini key can be minted. Any OpenAI-compatible provider works
 * here; Groq is the default (free, no credit card) with OpenRouter as fallback.
 *
 * Usage:
 *   node services/generate-description.js                  # start on port 8787
 *   node services/generate-description.js --port 9000
 *   node services/generate-description.js --provider openrouter
 *
 * Config (.env):
 *   GAMEDAY_AI_PROVIDER=groq            # groq | openrouter
 *   GROQ_API_KEY=your_key               # https://console.groq.com/keys
 *   OPENROUTER_API_KEY=your_key         # https://openrouter.ai/keys
 *   GAMEDAY_AI_MODEL=                   # optional model override
 *   GAMEDAY_AI_PORT=8787
 *
 * Endpoints:
 *   GET  /health                      -> { ok, provider, model, configured }
 *   POST /description { event }       -> { description }
 */

const http = require('http');

const PROVIDERS = {
  groq: {
    baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
    keyEnv: 'GROQ_API_KEY',
    defaultModel: 'openai/gpt-oss-120b',
    keyUrl: 'https://console.groq.com/keys'
  },
  openrouter: {
    baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
    keyEnv: 'OPENROUTER_API_KEY',
    defaultModel: 'meta-llama/llama-3.3-70b-instruct:free',
    keyUrl: 'https://openrouter.ai/keys'
  }
};

const DEFAULT_PROVIDER = process.env.GAMEDAY_AI_PROVIDER || 'groq';
const PORT = Number(process.env.GAMEDAY_AI_PORT || 8787);

function resolveProvider(name) {
  const key = String(name || DEFAULT_PROVIDER).trim().toLowerCase();
  const provider = PROVIDERS[key];
  if (!provider) {
    const known = Object.keys(PROVIDERS).join(', ');
    throw new Error(`Unknown AI provider "${name}". Known providers: ${known}.`);
  }
  return { name: key, ...provider };
}

function parseArgs(argv) {
  const flags = { port: PORT, provider: DEFAULT_PROVIDER };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith('--port=')) flags.port = Number(arg.slice('--port='.length));
    else if (arg === '--port') flags.port = Number(argv[++i]);
    else if (arg.startsWith('--provider=')) flags.provider = arg.slice('--provider='.length);
    else if (arg === '--provider') flags.provider = argv[++i];
  }
  if (!Number.isFinite(flags.port) || flags.port <= 0) flags.port = PORT;
  return flags;
}

function buildPrompt(event) {
  event = event || {};
  const facts = [
    ['Event', event.eventName || event.title],
    ['Sport', event.sport],
    ['Level', event.level],
    ['Opponent', event.opponent],
    ['Opponent mascot', event.opponentMascot],
    ['Home/Away', event.locationType],
    ['Venue', event.location || event.venueName],
    ['Date', event.date],
    ['Start time', event.startTime || event.time],
    ['Status', event.status]
  ]
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '')
    .map(([label, value]) => `${label}: ${value}`)
    .join('\n');

  return [
    'You write short, friendly, factual event blurbs for a high-school sports app.',
    'Write ONE description of 2 to 3 sentences (max 45 words).',
    'Use only the facts provided. Do not invent scores, records, or names.',
    'If key facts are missing, keep it general instead of guessing.',
    'No emojis, no quotes, no markdown - just the sentence(s).',
    '',
    'Event facts:',
    facts || '(no details provided)'
  ].join('\n');
}

async function callModel(event, providerName, modelOverride) {
  const provider = resolveProvider(providerName);
  const apiKey = process.env[provider.keyEnv] || '';
  const model = modelOverride || process.env.GAMEDAY_AI_MODEL || provider.defaultModel;

  if (!apiKey) {
    const err = new Error(`${provider.keyEnv} is not set. Add it to .env (get one at ${provider.keyUrl}).`);
    err.statusCode = 503;
    throw err;
  }

  const body = {
    model,
    messages: [{ role: 'user', content: buildPrompt(event || {}) }],
    temperature: 0.6,
    max_tokens: 600
  };

  const response = await fetch(provider.baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    const err = new Error(`${provider.name} API error ${response.status}: ${text.slice(0, 300)}`);
    err.statusCode = response.status === 429 ? 429 : 502;
    throw err;
  }

  const data = await response.json();
  const choice = data && data.choices && data.choices[0];
  const text = (choice && choice.message && choice.message.content ? choice.message.content : '').trim();
  if (!text) {
    const err = new Error(`${provider.name} returned an empty response (it may have been blocked by a safety filter).`);
    err.statusCode = 502;
    throw err;
  }
  return text.replace(/\s+/g, ' ').slice(0, 600);
}

function sendJson(res, status, payload) {
  const data = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(data);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 100000) reject(new Error('Request body too large'));
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch (_) { reject(new Error('Invalid JSON body')); }
    });
    req.on('error', reject);
  });
}

function createServer(options = {}) {
  const providerName = options.provider || DEFAULT_PROVIDER;
  let provider;
  try {
    provider = resolveProvider(providerName);
  } catch (err) {
    // Fall back to the default provider so the server still starts and reports
    // the misconfiguration via /health rather than crashing on boot.
    provider = resolveProvider('groq');
  }
  const model = process.env.GAMEDAY_AI_MODEL || provider.defaultModel;

  return http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost`);

    if (req.method === 'OPTIONS') return sendJson(res, 204, {});

    if (req.method === 'GET' && url.pathname === '/health') {
      return sendJson(res, 200, {
        ok: true,
        provider: provider.name,
        model,
        configured: Boolean(process.env[provider.keyEnv])
      });
    }

    if (req.method === 'POST' && url.pathname === '/description') {
      try {
        const body = await readBody(req);
        const description = await callModel(body && body.event, provider.name, model);
        return sendJson(res, 200, { description });
      } catch (err) {
        return sendJson(res, err.statusCode || 500, { error: err.message });
      }
    }

    return sendJson(res, 404, { error: 'Not found' });
  });
}

function main() {
  const flags = parseArgs(process.argv);
  let provider;
  try {
    provider = resolveProvider(flags.provider);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
  const model = process.env.GAMEDAY_AI_MODEL || provider.defaultModel;
  const server = createServer({ provider: provider.name });
  server.listen(flags.port, () => {
    console.log(`GameDay+ AI description service on http://localhost:${flags.port}`);
    console.log(`Provider: ${provider.name} | Model: ${model} | Key: ${process.env[provider.keyEnv] ? 'configured' : `MISSING (set ${provider.keyEnv} in .env)`}`);
  });
}

if (require.main === module) {
  main();
}

module.exports = { createServer, callModel, buildPrompt, resolveProvider, PROVIDERS };
