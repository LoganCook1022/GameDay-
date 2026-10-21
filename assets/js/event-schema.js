/**
 * GameDay+ - Shared Event Schema
 *
 * Single source of truth for:
 *   - event identity (canonical `externalKey` + deterministic Firestore doc id)
 *   - field ownership (which writer may touch which field)
 *   - a pure, conflict-aware merge that never clobbers admin-owned data
 *
 * Browser + Node compatible (same pattern as assets/js/utils.js), so the admin
 * console, the ICS sync service and the seeding scripts all agree on the rules.
 */

const GameDayEventSchema = (function () {
  const SCHEMA_VERSION = 2;

  const SOURCE_LOCAL = 'local';
  const SOURCE_ICS = 'ics';
  const SOURCE_SEED = 'seed';
  const SOURCE_ADMIN = 'admin';

  // Fields an external feed (ICS/Arbiter) is allowed to refresh.
  const SYNC_OWNED_FIELDS = [
    'sport',
    'gender',
    'level',
    'opponent',
    'locationType',
    'homeAway',
    'date',
    'time',
    'startTime',
    'endTime',
    'venueName',
    'venueAddress',
    'location',
    'address',
    'lat',
    'lng',
    'parkingInfo',
    'ticketUrl',
    'status',
    'highlights'
  ];

  // Fields owned by the admin console. A sync must never write these.
  const ADMIN_OWNED_FIELDS = [
    'ourScore',
    'oppScore',
    'homeScore',
    'awayScore',
    'stats',
    'description',
    'eventName',
    'club',
    'opponentMascot',
    'eventType',
    'manualOverride',
    'scoresVerified',
    'statsVerified'
  ];

  // Identity/audit fields that are never part of a content diff.
  const METADATA_FIELDS = [
    'externalKey',
    'syncOwner',
    'source',
    'sourceId',
    'schemaVersion',
    'schoolId',
    'createdAt',
    'updatedAt'
  ];

  const DIFF_IGNORED_FIELDS = ['updatedAt', 'createdAt'];

  function encodePart(value) {
    return String(value === null || value === undefined ? '' : value)
      .trim()
      .replace(/\s+/g, '-')
      .replace(/:/g, '%3A')
      .replace(/\//g, '%2F');
  }

  function decodePart(value) {
    try {
      return decodeURIComponent(String(value));
    } catch (_) {
      return String(value);
    }
  }

  /**
   * Canonical event key: `schoolId:source:sourceId`.
   * schoolId/source are lower-cased; sourceId keeps its case but is escaped so
   * the key always splits into exactly three parts.
   */
  function buildExternalKey(schoolId, source, sourceId) {
    const school = encodePart(schoolId).toLowerCase();
    const src = encodePart(source || SOURCE_LOCAL).toLowerCase();
    const id = encodePart(sourceId);
    return `${school}:${src}:${id}`;
  }

  function parseExternalKey(key) {
    if (typeof key !== 'string') return null;
    const parts = key.split(':');
    if (parts.length !== 3) return null;
    if (!parts[0] || !parts[1] || !parts[2]) return null;
    return {
      schoolId: decodePart(parts[0]),
      source: decodePart(parts[1]),
      sourceId: decodePart(parts[2])
    };
  }

  /**
   * Migrates the three legacy key shapes onto the canonical scheme:
   *   `local:<id>`  -> `schoolId:local:<id>`
   *   `ics:<uid>`   -> `schoolId:ics:<uid>`
   *   `schoolId:<id>` (2 parts) -> `schoolId:<source>:<id>`
   * `context` supplies the schoolId/source/sourceId used when the raw key is
   * missing or ambiguous.
   */
  function normalizeExternalKey(raw, context) {
    const ctx = context || {};
    const schoolId = ctx.schoolId || '';
    const source = ctx.source || SOURCE_LOCAL;
    const sourceId = ctx.sourceId || '';

    if (typeof raw === 'string' && raw.trim()) {
      const value = raw.trim();
      const parsed = parseExternalKey(value);
      if (parsed) {
        return buildExternalKey(parsed.schoolId || schoolId, parsed.source, parsed.sourceId);
      }

      const legacy = value.split(':');
      if (legacy.length === 2) {
        const head = legacy[0];
        const tail = legacy[1];
        if (/^local$/i.test(head)) {
          return buildExternalKey(schoolId, SOURCE_LOCAL, tail);
        }
        if (/^ics$/i.test(head)) {
          return buildExternalKey(schoolId, SOURCE_ICS, tail);
        }
        return buildExternalKey(schoolId || head, source, sourceId || tail);
      }
    }

    return buildExternalKey(schoolId, source, sourceId);
  }

  function hashKey(key) {
    let hash = 5381;
    for (let i = 0; i < key.length; i += 1) {
      hash = ((hash << 5) + hash + key.charCodeAt(i)) | 0;
    }
    return (hash >>> 0).toString(36);
  }

  /** Firestore-safe, deterministic document id for an event key. */
  function docIdForExternalKey(key) {
    const safe = String(key || '').replace(/[^A-Za-z0-9_.-]/g, '_');
    return `${safe}-${hashKey(String(key || ''))}`;
  }

  function isSyncOwnedField(field) {
    return SYNC_OWNED_FIELDS.indexOf(field) !== -1;
  }

  function isAdminOwnedField(field) {
    return ADMIN_OWNED_FIELDS.indexOf(field) !== -1;
  }

  function valuesEqual(a, b) {
    if (a === b) return true;
    if (a === null || a === undefined || b === null || b === undefined) return false;
    if (typeof a === 'object' || typeof b === 'object') {
      try {
        return JSON.stringify(a) === JSON.stringify(b);
      } catch (_) {
        return false;
      }
    }
    return false;
  }

  function diffFields(before, after) {
    const changed = [];
    const keys = Object.keys(after || {});
    Object.keys(before || {}).forEach(key => {
      if (keys.indexOf(key) === -1) changed.push(key);
    });
    keys.forEach(key => {
      if (DIFF_IGNORED_FIELDS.indexOf(key) !== -1) return;
      if (!valuesEqual((before || {})[key], after[key])) changed.push(key);
    });
    return changed;
  }

  function defaultVerificationState() {
    return {
      manualOverride: false,
      scoresVerified: false,
      statsVerified: false
    };
  }

  /**
   * Content signature of an event. Documents that predate external keys are
   * matched with the event they represent through this signature, so a re-seed
   * updates the existing document instead of creating a duplicate.
   */
  function contentKey(event) {
    const data = event || {};
    return [
      String(data.schoolId || '').trim().toLowerCase(),
      String(data.sport || '').trim().toLowerCase(),
      String(data.gender || '').trim().toLowerCase(),
      String(data.date || '').trim(),
      String(data.opponent || '').trim().toLowerCase()
    ].join('|');
  }

  /**
   * Finds the stored document an incoming event refers to.
   * Matching order: canonical external key -> document id -> content signature.
   */
  function findMatchingEvent(entries, criteria) {
    const crit = criteria || {};
    const externalKey = crit.externalKey;
    const ids = [crit.docId, crit.sourceId]
      .filter(value => value !== null && value !== undefined && value !== '')
      .map(String);
    const content = crit.contentKey;

    let byId = null;
    let byContent = null;

    for (const entry of entries || []) {
      const data = entry.data || {};
      if (externalKey && data.externalKey === externalKey) return entry;
      const matchesId = ids.length > 0
        && (ids.indexOf(String(entry.id)) !== -1 || (data.id && ids.indexOf(String(data.id)) !== -1));
      if (matchesId) {
        if (!byId) byId = entry;
      } else if (content && contentKey(data) === content && !byContent) {
        byContent = entry;
      }
    }

    return byId || byContent;
  }

  /**
   * Pure, conflict-aware merge.
   *
   * source = 'admin'  -> the admin console is authoritative for what it sends.
   * source = 'sync'   -> only sync-owned fields may be refreshed; admin-owned
   *                      fields are preserved. A doc with manualOverride=true is
   *                      left completely untouched.
   * source = 'seed'   -> same ownership rules as 'sync'.
   *
   * Returns { data, changed, changedFields, skipped } - `data` never contains a
   * timestamp, so the caller decides when (and only when) to stamp `updatedAt`.
   */
  function mergeEvent(existing, incoming, options) {
    const opts = options || {};
    const source = opts.source || SOURCE_SEED;
    const base = existing && typeof existing === 'object' ? existing : {};
    const inc = incoming && typeof incoming === 'object' ? incoming : {};

    if (source === SOURCE_ADMIN) {
      const merged = { ...base };
      Object.keys(inc).forEach(field => {
        if (METADATA_FIELDS.indexOf(field) !== -1) return;
        if (inc[field] !== undefined) merged[field] = inc[field];
      });
      const changedFields = diffFields(base, merged);
      return { data: merged, changed: changedFields.length > 0, changedFields, skipped: null };
    }

    if (base.manualOverride === true) {
      return { data: { ...base }, changed: false, changedFields: [], skipped: 'manual-override' };
    }

    const merged = { ...base };

    SYNC_OWNED_FIELDS.forEach(field => {
      if (inc[field] !== undefined) merged[field] = inc[field];
    });

    // Admin-owned data is only seeded on first write; afterwards it is never
    // overwritten by a feed or a re-seed.
    ADMIN_OWNED_FIELDS.forEach(field => {
      if (base[field] === undefined && inc[field] !== undefined) merged[field] = inc[field];
    });

    if (inc.externalKey) merged.externalKey = inc.externalKey;
    if (inc.syncOwner !== undefined) merged.syncOwner = inc.syncOwner;
    if (inc.schoolId !== undefined) merged.schoolId = inc.schoolId;
    if (inc.source !== undefined) merged.source = inc.source;
    if (inc.sourceId !== undefined) merged.sourceId = inc.sourceId;

    const changedFields = diffFields(base, merged);
    return { data: merged, changed: changedFields.length > 0, changedFields, skipped: null };
  }

  function stripUndefined(payload) {
    const output = {};
    Object.keys(payload || {}).forEach(key => {
      if (payload[key] !== undefined) output[key] = payload[key];
    });
    return output;
  }

  return {
    SCHEMA_VERSION,
    SOURCE_LOCAL,
    SOURCE_ICS,
    SOURCE_SEED,
    SOURCE_ADMIN,
    SYNC_OWNED_FIELDS,
    ADMIN_OWNED_FIELDS,
    METADATA_FIELDS,
    buildExternalKey,
    parseExternalKey,
    normalizeExternalKey,
    docIdForExternalKey,
    isSyncOwnedField,
    isAdminOwnedField,
    mergeEvent,
    diffFields,
    defaultVerificationState,
    contentKey,
    findMatchingEvent,
    stripUndefined
  };
})();

if (typeof window !== 'undefined') window.GameDayEventSchema = GameDayEventSchema;
if (typeof module !== 'undefined' && module.exports) module.exports = GameDayEventSchema;
