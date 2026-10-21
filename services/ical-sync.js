require('dotenv').config();

const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const ical = require('node-ical');

const schema = require('../assets/js/event-schema.js');
const { createFirestoreClient } = require('./lib/firestore-client.js');

const DEFAULT_ICS_URL = process.env.ICAL_FEED_URL || '';
const ARBITER_CALENDAR_URL = process.env.ARBITER_SCHOOL_URL || 'https://arbiterlive.com/School/Calendar/22686';
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';
const LIVE_DATA_PATH = path.resolve(__dirname, '../data/events.json');
const DEFAULT_SCHOOL_ID = process.env.GAMEDAY_SCHOOL_ID || 'sugar-salem';
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'school-project-6dd54';

const SPORT_KEYWORDS = [
  { sport_id: 1, keywords: ['basketball', 'hoops', 'cagers'] },
  { sport_id: 2, keywords: ['soccer', 'football', 'futbol'] },
  { sport_id: 3, keywords: ['volleyball', 'vb'] },
  { sport_id: 4, keywords: ['baseball', 'softball'] },
  { sport_id: 5, keywords: ['track', 'cross country', 'xc'] },
  { sport_id: 6, keywords: ['wrestling', 'mat'] },
  { sport_id: 7, keywords: ['tennis'] },
  { sport_id: 8, keywords: ['golf'] },
  { sport_id: 9, keywords: ['swim', 'swimming'] },
  { sport_id: 10, keywords: ['lacrosse'] },
  { sport_id: 11, keywords: ['cheer', 'dance'] }
];

// Runtime state for a single sync run. `dryRun` is the default: nothing is
// written to Firestore unless --apply is passed.
const runtime = {
  schoolId: DEFAULT_SCHOOL_ID,
  client: null,
  dryRun: true,
  eventIndex: new Map(),
  locationIndex: new Map(),
  pendingWrites: [],
  summary: { created: 0, updated: 0, unchanged: 0, skipped: 0 },
  now: new Date().toISOString()
};

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function getSportId(title) {
  const text = normalizeText(title).toLowerCase();
  if (!text) return null;

  for (const sport of SPORT_KEYWORDS) {
    if (sport.keywords.some(keyword => text.includes(keyword.toLowerCase()))) {
      return sport.sport_id;
    }
  }

  return null;
}

async function geocodeLocation(locationText, apiKey) {
  const rawLocation = normalizeText(locationText);
  if (!rawLocation || !apiKey) return null;

  const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(rawLocation)}&key=${apiKey}`);
  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    return null;
  }

  const result = data.results[0];
  return {
    lat: result.geometry.location.lat,
    lng: result.geometry.location.lng,
    formatted_address: result.formatted_address
  };
}

function locationKey(locationRow) {
  const seed = locationRow.address || locationRow.location_name || locationRow.name || 'unknown';
  return schema.buildExternalKey(runtime.schoolId, 'location', normalizeText(seed).toLowerCase());
}

/**
 * Upserts a venue. The whole location document is owned by the feed, so the
 * write is a plain merge of the feed's own fields.
 */
async function upsertLocation(locationRow) {
  if (!runtime.client) return locationRow;

  const externalKey = locationKey(locationRow);
  const docId = schema.docIdForExternalKey(externalKey);
  const docPath = `schools/${runtime.schoolId}/locations/${docId}`;
  const existing = runtime.locationIndex.get(externalKey) || null;
  const fields = {
    externalKey,
    name: locationRow.location_name || locationRow.name || 'Venue',
    address: locationRow.address || '',
    lat: locationRow.latitude ?? locationRow.lat ?? null,
    lng: locationRow.longitude ?? locationRow.lng ?? null,
    source: locationRow.source || 'ical-sync',
    updatedAt: runtime.now
  };

  if (existing) {
    const changed = Object.keys(fields).filter(key => key !== 'updatedAt' && JSON.stringify(existing.data[key]) !== JSON.stringify(fields[key]));
    if (!changed.length) {
      runtime.locationIndex.set(externalKey, { id: existing.id, data: existing.data });
      return { ...locationRow, externalKey, status: 'unchanged' };
    }
    runtime.locationIndex.set(externalKey, { id: existing.id, data: { ...existing.data, ...fields } });
    runtime.pendingWrites.push({ path: `schools/${runtime.schoolId}/locations/${existing.id}`, fields });
    return { ...locationRow, externalKey, status: 'updated' };
  }

  runtime.locationIndex.set(externalKey, { id: docId, data: fields });
  runtime.pendingWrites.push({ path: docPath, fields });
  return { ...locationRow, externalKey, status: 'created' };
}

/**
 * Upserts a game as a website event. The event is identified by its canonical
 * external key, and only feed-owned fields are ever written - admin scores,
 * stats and manual overrides are left alone.
 */
async function upsertGame(gameRow) {
  if (!runtime.client) return gameRow;

  const payload = mapEventToWebsitePayload(gameRow, { schoolId: runtime.schoolId });
  const docId = schema.docIdForExternalKey(payload.externalKey);
  const existing = runtime.eventIndex.get(payload.externalKey)
    || runtime.eventIndex.get(`id:${payload.sourceId}`)
    || null;

  if (existing) {
    const merge = schema.mergeEvent(existing.data, payload, { source: schema.SOURCE_ICS });
    if (merge.skipped) {
      runtime.summary.skipped += 1;
      return { ...gameRow, status: 'skipped', reason: merge.skipped };
    }
    if (!merge.changed) {
      runtime.summary.unchanged += 1;
      return { ...gameRow, status: 'unchanged' };
    }
    const fields = {};
    merge.changedFields.forEach(field => { fields[field] = merge.data[field]; });
    fields.externalKey = payload.externalKey;
    fields.syncOwner = schema.SOURCE_ICS;
    fields.source = payload.source;
    fields.sourceId = payload.sourceId;
    fields.updatedAt = runtime.now;
    runtime.eventIndex.set(payload.externalKey, { id: existing.id, data: { ...existing.data, ...fields } });
    runtime.pendingWrites.push({ path: `schools/${runtime.schoolId}/events/${existing.id}`, fields });
    runtime.summary.updated += 1;
    return { ...gameRow, status: 'updated' };
  }

  const fields = {
    ...schema.stripUndefined(payload),
    id: docId,
    createdAt: runtime.now,
    updatedAt: runtime.now
  };
  runtime.eventIndex.set(payload.externalKey, { id: docId, data: fields });
  runtime.pendingWrites.push({ path: `schools/${runtime.schoolId}/events/${docId}`, fields });
  runtime.summary.created += 1;
  return { ...gameRow, status: 'created' };
}

function parseArbiterEventText(rawText) {
  const safeText = normalizeText(rawText || '').replace(/\s*\(.*?\)/g, '');
  if (!safeText) return null;

  const timeMatch = safeText.match(/(\d{1,2}:\d{2}\s*[ap]m?)\s*(?:-\s*(\d{1,2}:\d{2}\s*[ap]m?))?/i);
  const timeRange = timeMatch ? `${timeMatch[1]}${timeMatch[2] ? ' - ' + timeMatch[2] : ''}` : null;

  let content = safeText;
  if (timeMatch) {
    content = safeText.slice(timeMatch.index + timeMatch[0].length).trim();
  }

  const opponentMatch = content.match(/^(.*?)(?:\s+vs\.?\s+|\s+at\s+)(.*)$/i);
  const title = opponentMatch ? opponentMatch[1].trim() : content.trim();
  const opponent = opponentMatch ? opponentMatch[2].trim() : null;

  if (!title) return null;

  return {
    title,
    opponent,
    timeRange,
    sport_id: getSportId(title),
    raw: safeText
  };
}

async function scrapeArbiterCalendar(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 GameDay+ Sync Bot',
      'Accept': 'text/html,application/xhtml+xml'
    }
  });

  if (!response.ok) {
    throw new Error(`Arbiter calendar fetch failed with HTTP ${response.status}`);
  }

  const html = await response.text();
  const eventLinks = [...html.matchAll(/<a[^>]*href=['\"]([^'\"]+)['\"][^>]*>(.*?)<\/a>/gi)];
  const events = [];

  for (const match of eventLinks) {
    const href = match[1];
    const rawText = match[2].replace(/<[^>]+>/g, ' ');
    const cleanedText = normalizeText(rawText.replace(/&nbsp;/gi, ' '));

    if (!cleanedText || !/\d{1,2}:\d{2}/.test(cleanedText)) continue;
    if (!/vs\.|\bat\b|basketball|soccer|volleyball|football|baseball|softball|track|wrestling|tennis|golf|swim|lacrosse|cheer|dance/i.test(cleanedText)) {
      continue;
    }

    const eventData = parseArbiterEventText(cleanedText);
    if (!eventData) continue;

    let startDate = null;
    const dateMatch = html.match(/([A-Z][a-z]+\s+\d{1,2},\s*\d{4})/);
    if (dateMatch) {
      startDate = new Date(dateMatch[1]);
    }

    const eventDate = startDate ? new Date(startDate) : new Date();
    const title = eventData.title;
    const opponent = eventData.opponent || 'Opponent';
    const locationText = opponent && /\bat\b/i.test(cleanedText) ? opponent : 'TBD';

    events.push({
      ical_uid: `arbiter-${href}-${title}`,
      sport_id: eventData.sport_id || getSportId(title),
      title,
      opponent,
      location_text: locationText,
      venue_name: locationText,
      venue_address: locationText,
      start_at: eventDate.toISOString(),
      end_at: eventDate.toISOString(),
      status: 'scheduled',
      source: 'arbiterlive',
      raw_summary: cleanedText
    });
  }

  return events;
}

async function syncIcalFeed(icsUrl = DEFAULT_ICS_URL) {
  if (!icsUrl) {
    throw new Error('Missing ICAL_FEED_URL in the environment. Set it in .env or pass a URL into syncIcalFeed().');
  }

  const isIcsFeed = /\.ics($|\?|#)/i.test(icsUrl) || /ical/i.test(icsUrl);
  const events = isIcsFeed
    ? await syncIcsFeed(icsUrl)
    : await syncArbiterCalendarSource(icsUrl);

  return { count: events.length, events };
}

async function syncIcsFeed(icsUrl) {
  const rawFeed = await ical.fromURL(icsUrl);
  const insertedOrUpdated = [];

  for (const [uid, event] of Object.entries(rawFeed)) {
    if (!event || event.type !== 'VEVENT') continue;

    const summary = normalizeText(event.summary || event.title || 'Athletic Event');
    const start = event.start || event.dtstart;
    const end = event.end || event.dtend;
    const locationText = normalizeText(event.location || 'TBD');
    const sport_id = getSportId(summary);
    const ical_uid = normalizeText(event.uid || uid);

    let latitude = null;
    let longitude = null;
    let venue_name = locationText;
    let venue_address = locationText;

    if (locationText && locationText !== 'TBD' && GOOGLE_MAPS_API_KEY) {
      const geocode = await geocodeLocation(locationText, GOOGLE_MAPS_API_KEY);
      if (geocode) {
        latitude = geocode.lat;
        longitude = geocode.lng;
        venue_name = locationText;
        venue_address = geocode.formatted_address;

        await upsertLocation({
          location_name: locationText,
          google_place_id: null,
          address: geocode.formatted_address,
          latitude,
          longitude,
          source: 'ical-sync'
        });
      }
    }

    const row = {
      ical_uid,
      sport_id,
      title: summary,
      start_at: start ? new Date(start).toISOString() : null,
      end_at: end ? new Date(end).toISOString() : null,
      venue_name,
      venue_address,
      location_text: locationText,
      latitude,
      longitude,
      status: 'scheduled',
      raw_summary: summary,
      updated_at: new Date().toISOString(),
      source: 'ical'
    };

    await upsertGame(row);
    insertedOrUpdated.push(row);
  }

  return insertedOrUpdated;
}

async function syncArbiterCalendarSource(url = ARBITER_CALENDAR_URL) {
  const events = await scrapeArbiterCalendar(url);
  const insertedOrUpdated = [];

  for (const event of events) {
    let latitude = null;
    let longitude = null;
    let venue_name = event.venue_name || event.location_text || 'TBD';
    let venue_address = event.venue_address || event.location_text || 'TBD';

    if (event.location_text && event.location_text !== 'TBD' && GOOGLE_MAPS_API_KEY) {
      const geocode = await geocodeLocation(event.location_text, GOOGLE_MAPS_API_KEY);
      if (geocode) {
        latitude = geocode.lat;
        longitude = geocode.lng;
        venue_name = event.location_text;
        venue_address = geocode.formatted_address;

        await upsertLocation({
          location_name: event.location_text,
          address: geocode.formatted_address,
          latitude,
          longitude,
          source: 'arbiterlive'
        });
      }
    }

    const row = {
      ...event,
      venue_name,
      venue_address,
      latitude,
      longitude,
      updated_at: new Date().toISOString()
    };

    await upsertGame(row);
    insertedOrUpdated.push(row);
  }

  return insertedOrUpdated;
}

function startIcalSyncCron() {
  cron.schedule('0 */6 * * *', async () => {
    try {
      const result = await runOnce({ apply: true });
      console.log(`[ical-sync] Synced ${result.count} events at ${new Date().toISOString()}`);
    } catch (error) {
      console.error('[ical-sync] Sync failed:', error.message);
    }
  });

  console.log('[ical-sync] Scheduled to run every 6 hours.');
}

/**
 * Maps a feed row onto the website event shape. Admin-owned fields (scores,
 * stats, verification flags) are deliberately absent so a feed can never
 * clear data an admin entered.
 */
function mapEventToWebsitePayload(event, context) {
  const ctx = context || {};
  const schoolId = ctx.schoolId || DEFAULT_SCHOOL_ID;
  const start = event.start_at ? new Date(event.start_at) : new Date();
  const date = start.toISOString().slice(0, 10);
  const time = start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const sourceId = normalizeText(event.ical_uid || event.sourceId || event.id || '');
  const externalKey = schema.normalizeExternalKey(event.externalKey, {
    schoolId,
    source: schema.SOURCE_ICS,
    sourceId
  });
  const docId = schema.docIdForExternalKey(externalKey);
  const sport = event.title ? event.title.split(/\s+vs\.?\s+|\s+at\s+/i)[0].trim() : 'Other';
  const opponent = event.opponent || 'Opponent';

  return {
    id: docId,
    externalKey,
    source: schema.SOURCE_ICS,
    sourceId,
    schoolId,
    sport,
    gender: 'Varsity',
    level: 'Varsity',
    opponent,
    locationType: /\bat\b/i.test(event.title || '') ? 'Away' : 'Home',
    date,
    time,
    venueName: event.venue_name || event.location_text || 'TBD',
    venueAddress: event.venue_address || event.location_text || 'TBD',
    lat: event.latitude || null,
    lng: event.longitude || null,
    parkingInfo: 'Live sync from Arbiter/ICS feed.',
    ticketUrl: '',
    status: event.status || 'Scheduled',
    highlights: event.raw_summary || ''
  };
}

function writeLiveDataFile(events, targetPath) {
  const destination = targetPath ? path.resolve(targetPath) : LIVE_DATA_PATH;
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, JSON.stringify({ events }, null, 2), 'utf8');
  return destination;
}

async function loadIndexes(client, schoolId) {
  const eventDocs = await client.listDocs(`schools/${schoolId}/events`);
  const locationDocs = await client.listDocs(`schools/${schoolId}/locations`);

  runtime.eventIndex = new Map();
  runtime.locationIndex = new Map();

  eventDocs.forEach(doc => {
    const data = doc.data || {};
    if (data.externalKey) runtime.eventIndex.set(data.externalKey, { id: doc.id, data });
    if (data.id) runtime.eventIndex.set(`id:${data.id}`, { id: doc.id, data });
  });

  locationDocs.forEach(doc => {
    const data = doc.data || {};
    if (data.externalKey) runtime.locationIndex.set(data.externalKey, { id: doc.id, data });
  });
}

async function runOnce(options) {
  const opts = options || {};
  const schoolId = opts.schoolId || runtime.schoolId;
  const source = opts.feed || DEFAULT_ICS_URL || ARBITER_CALENDAR_URL;

  runtime.schoolId = schoolId;
  runtime.dryRun = opts.apply !== true;
  runtime.now = new Date().toISOString();
  runtime.pendingWrites = [];
  runtime.summary = { created: 0, updated: 0, unchanged: 0, skipped: 0 };

  if (!runtime.client) {
    runtime.client = await createFirestoreClient({ projectId: PROJECT_ID });
  }
  await loadIndexes(runtime.client, schoolId);

  try {
    const result = await syncIcalFeed(source);
    const payload = (result.events || []).map(event => mapEventToWebsitePayload(event, { schoolId }));

    const pending = runtime.pendingWrites;
    if (!runtime.dryRun && pending.length) {
      await runtime.client.commit(pending);
    }

    const exported = opts.export ? writeLiveDataFile(payload, opts.export) : null;

    console.log(`[ical-sync] ${runtime.dryRun ? 'DRY RUN' : 'APPLIED'} school=${schoolId} feed=${source}`);
    console.log(`[ical-sync] events: ${result.count} processed, ${runtime.summary.created} created, ${runtime.summary.updated} updated, ${runtime.summary.unchanged} unchanged, ${runtime.summary.skipped} skipped (manual override)`);
    console.log(`[ical-sync] firestore writes: ${runtime.dryRun ? pending.length + ' (not sent)' : pending.length}`);
    if (exported) console.log(`[ical-sync] exported schedule to ${exported}`);

    return { ...result, payload, summary: runtime.summary, writes: pending, exported, dryRun: runtime.dryRun };
  } catch (error) {
    console.error('[ical-sync] Run failed:', error.message);
    throw error;
  }
}

function parseArgs(argv) {
  const flags = {
    once: false,
    cron: false,
    apply: false,
    school: DEFAULT_SCHOOL_ID,
    feed: '',
    export: ''
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--once') flags.once = true;
    else if (arg === '--cron') flags.cron = true;
    else if (arg === '--apply') flags.apply = true;
    else if (arg === '--school') flags.school = argv[++i];
    else if (arg.startsWith('--school=')) flags.school = arg.slice('--school='.length);
    else if (arg === '--feed') flags.feed = argv[++i];
    else if (arg.startsWith('--feed=')) flags.feed = arg.slice('--feed='.length);
    else if (arg === '--export') {
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        flags.export = next;
        i += 1;
      } else {
        flags.export = LIVE_DATA_PATH;
      }
    } else if (arg.startsWith('--export=')) flags.export = arg.slice('--export='.length) || LIVE_DATA_PATH;
  }

  return flags;
}

if (require.main === module) {
  const flags = parseArgs(process.argv);

  if (flags.cron) {
    startIcalSyncCron();
  }

  runOnce({ apply: flags.apply, school: flags.school, feed: flags.feed, export: flags.export })
    .catch(error => {
      console.error('[ical-sync] Aborted:', error.message);
      process.exit(1);
    });
}

module.exports = {
  syncIcalFeed,
  syncIcsFeed,
  syncArbiterCalendarSource,
  scrapeArbiterCalendar,
  startIcalSyncCron,
  runOnce,
  getSportId,
  geocodeLocation,
  parseArbiterEventText,
  mapEventToWebsitePayload,
  upsertGame,
  upsertLocation,
  syncState: runtime
};
