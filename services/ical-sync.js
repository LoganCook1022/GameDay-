require('dotenv').config();

const cron = require('node-cron');
const ical = require('node-ical');

const DEFAULT_ICS_URL = process.env.ICAL_FEED_URL;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';

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

function normalizeText(value) {
  return String(value || '').trim();
}

function getSportId(title) {
  const text = normalizeText(title).toLowerCase();
  if (!text) return null;

  for (const sport of SPORT_KEYWORDS) {
    const match = sport.keywords.some(keyword => text.includes(keyword.toLowerCase()));
    if (match) return sport.sport_id;
  }

  return null;
}

async function geocodeLocation(locationText, apiKey) {
  const rawLocation = normalizeText(locationText);
  if (!rawLocation || !apiKey) return null;

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(rawLocation)}&key=${apiKey}`;

  const response = await fetch(url);
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

async function upsertLocation(locationRow) {
  // Replace this section with your real database layer.
  // Example: await db.from('locations').upsert({ ...locationRow }, { onConflict: 'google_place_id' });
  console.log('[locations.upsert]', locationRow);
  return locationRow;
}

async function upsertGame(gameRow) {
  // Replace this section with your real database layer.
  // Example: await db.from('games').upsert({ ...gameRow }, { onConflict: 'ical_uid' });
  console.log('[games.upsert]', gameRow);
  return gameRow;
}

async function syncIcalFeed(icsUrl = DEFAULT_ICS_URL) {
  if (!icsUrl) {
    throw new Error('Missing ICAL_FEED_URL in the environment. Set it in .env or pass a URL into syncIcalFeed().');
  }

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

    if (locationText && locationText !== 'TBD') {
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

    const gameRow = {
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
      updated_at: new Date().toISOString()
    };

    await upsertGame(gameRow);
    insertedOrUpdated.push(gameRow);
  }

  return {
    count: insertedOrUpdated.length,
    events: insertedOrUpdated
  };
}

function startIcalSyncCron() {
  cron.schedule('0 */6 * * *', async () => {
    try {
      const result = await syncIcalFeed();
      console.log(`[ical-sync] Synced ${result.count} events at ${new Date().toISOString()}`);
    } catch (error) {
      console.error('[ical-sync] Sync failed:', error.message);
    }
  });

  console.log('[ical-sync] Scheduled to run every 6 hours.');
}

async function runOnce() {
  try {
    const result = await syncIcalFeed();
    console.log(`[ical-sync] Completed sync: ${result.count} events processed.`);
    return result;
  } catch (error) {
    console.error('[ical-sync] Run failed:', error.message);
    throw error;
  }
}

if (require.main === module) {
  const shouldRunOnce = process.argv.includes('--once');

  if (shouldRunOnce) {
    runOnce();
  } else {
    startIcalSyncCron();
    runOnce();
  }
}

module.exports = {
  syncIcalFeed,
  startIcalSyncCron,
  runOnce,
  getSportId,
  geocodeLocation
};
