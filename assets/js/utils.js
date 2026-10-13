/**
 * GameDay+ - Shared Utilities
 * HTML-escaping helpers and the canonical school-id allowlist.
 *
 * Loaded before every other GameDay+ script so all modules can rely on
 * window.GameDayUtils. Also exported via module.exports so the same code can be
 * unit-tested under Node (node:test) without a browser.
 */

const GameDayUtils = (function () {
  function escapeHtml(value) {
    return String(value === null || value === undefined ? '' : value).replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char]));
  }

  // Attribute context escaping is identical to HTML text escaping here because
  // every attribute we emit is double-quoted.
  function escapeAttr(value) {
    return escapeHtml(value);
  }

  // Safe for values embedded in single-quoted JS string literals inside inline
  // handlers (legacy fallback only; prefer data-* attributes).
  function escapeQuotes(value) {
    return String(value === null || value === undefined ? '' : value)
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'");
  }

  // Canonical school ids. Kept in sync with app.js SCHOOL_OPTIONS and
  // services/seed-all-schools.js SCHOOLS. The `?school=` query parameter is
  // validated against this list so it can never be used to index arbitrary data.
  const KNOWN_SCHOOL_IDS = [
    'sugar-salem',
    'south-fremont',
    'teton',
    'snake-river',
    'madison',
    'rigby'
  ];

  function isKnownSchool(id) {
    return KNOWN_SCHOOL_IDS.indexOf(id) !== -1;
  }

  function normalizeSchoolId(id, fallback) {
    const value = typeof id === 'string' ? id.trim() : '';
    return isKnownSchool(value) ? value : (fallback === undefined ? null : fallback);
  }

  return {
    escapeHtml,
    escapeAttr,
    escapeQuotes,
    KNOWN_SCHOOL_IDS,
    isKnownSchool,
    normalizeSchoolId
  };
})();

if (typeof window !== 'undefined') window.GameDayUtils = GameDayUtils;
if (typeof module !== 'undefined' && module.exports) module.exports = GameDayUtils;
