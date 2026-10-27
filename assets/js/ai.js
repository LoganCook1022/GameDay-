/**
 * GameDay+ - AI event description client
 *
 * Talks to the local AI description service (services/generate-description.js)
 * so the admin dashboard can draft an event blurb with one click. The provider
 * API key stays server-side; the browser only knows this localhost endpoint.
 *
 * Degrades quietly: if the service isn't running or no key is configured, the
 * caller receives { ok: false, reason } and the UI shows a helpful message.
 */

const GameDayAI = (function () {
  const DEFAULT_ENDPOINT = 'http://localhost:8787';
  const utils = window.GameDayUtils || {};

  function endpoint() {
    return (window.GAMEDAY_AI_ENDPOINT || DEFAULT_ENDPOINT).replace(/\/$/, '');
  }

  async function generateDescription(event) {
    try {
      const response = await fetch(`${endpoint()}/description`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: event || {} })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        return { ok: false, reason: 'service-error', error: data.error || `HTTP ${response.status}` };
      }
      if (!data.description) {
        return { ok: false, reason: 'empty' };
      }
      return { ok: true, description: data.description };
    } catch (err) {
      return { ok: false, reason: 'unreachable', error: err.message };
    }
  }

  async function health() {
    try {
      const response = await fetch(`${endpoint()}/health`);
      if (!response.ok) return { ok: false, configured: false };
      const data = await response.json();
      return { ok: true, configured: Boolean(data.configured), model: data.model };
    } catch (_) {
      return { ok: false, configured: false };
    }
  }

  function friendlyError(result) {
    if (!result || result.ok) return '';
    if (result.reason === 'unreachable') {
      return 'AI service is not running. Start it with: node services/generate-description.js';
    }
    if (result.reason === 'service-error' && /API_KEY/.test(result.error || '')) {
      return 'Add your AI provider key to .env, then restart the AI service.';
    }
    return result.error || 'Could not generate a description.';
  }

  return { generateDescription, health, friendlyError, endpoint };
})();

window.GameDayAI = GameDayAI;
