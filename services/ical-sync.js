require('dotenv').config();

const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const ical = require('node-ical');

const DEFAULT_ICS_URL = process.env.ICAL_FEED_URL || '';
const ARBITER_CALENDAR_URL = process.env.ARBITER_SCHOOL_URL || 'https://arbiterlive.com/School/Calendar/22686';
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';
const LIVE_DATA_PATH = path.resolve(__dirname, '../data/events.json');

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

async function upsertLocation(locationRow) {
  // Replace with your real DB layer.
  // Example: await db.from('locations').upsert({ ...locationRow }, { onConflict: 'address' });
  console.log('[locations.upsert]', locationRow);
  return locationRow;
}

async function upsertGame(gameRow) {
  // Replace with your real DB layer.
  // Example: await db.from('games').upsert({ ...gameRow }, { onConflict: 'ical_uid' });
  console.log('[games.upsert]', gameRow);
  return gameRow;
}

function parseArbiterEventText(rawText) {
  const safeText = normalizeText(rawText || '').replace(/\s*\(.*?\)/g, '');
  if (!safeText) return null;

  const timeMatch = safeText.match(/(\d{1,2}:\d{2}\s*[ap]m?)\s*(?:-\s*(\d{1,2}:\d{2}\s*[ap]m?))?/i);
  const timeRange = timeMatch ? `${timeMatch[1]}${timeMatch[2] ? ` - ${timeMatch[2]}` : ''}` : null;

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
      const result = await syncIcalFeed(DEFAULT_ICS_URL || ARBITER_CALENDAR_URL);
      console.log(`[ical-sync] Synced ${result.count} events at ${new Date().toISOString()}`);
    } catch (error) {
      console.error('[ical-sync] Sync failed:', error.message);
    }
  });

  console.log('[ical-sync] Scheduled to run every 6 hours.');
}

function mapEventToWebsitePayload(event) {
  const start = event.start_at ? new Date(event.start_at) : new Date();
  const date = start.toISOString().slice(0, 10);
  const time = start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  return {
    id: event.ical_uid || `live-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    sport: event.title ? event.title.split(/\s+vs\.?\s+|\s+at\s+/i)[0].trim() : 'Other',
    gender: 'Varsity',
    level: 'Varsity',
    opponent: event.opponent || 'Opponent',
    locationType: /\bat\b/i.test(event.title || '') ? 'Away' : 'Home',
    date,
    time,
    venueName: event.venue_name || event.location_text || 'TBD',
    venueAddress: event.venue_address || event.location_text || 'TBD',
    lat: event.latitude || null,
    lng: event.longitude || null,
    parkingInfo: 'Live sync from Arbiter/ICS feed.',
    ticketUrl: '',
    ourScore: null,
    oppScore: null,
    status: event.status || 'Scheduled',
    highlights: event.raw_summary || '',
    stats: null
  };
}

function writeLiveDataFile(events) {
  fs.mkdirSync(path.dirname(LIVE_DATA_PATH), { recursive: true });
  fs.writeFileSync(LIVE_DATA_PATH, JSON.stringify(events, null, 2));
  return LIVE_DATA_PATH;
}

async function runOnce() {
  try {
    const source = DEFAULT_ICS_URL || ARBITER_CALENDAR_URL;
    const result = await syncIcalFeed(source);
    const payload = (result.events || []).map(mapEventToWebsitePayload);
    writeLiveDataFile(payload);
    console.log(`[ical-sync] Completed sync: ${result.count} events processed. Exported to ${LIVE_DATA_PATH}`);
    return { ...result, payload };
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
  syncIcsFeed,
  syncArbiterCalendarSource,
  scrapeArbiterCalendar,
  startIcalSyncCron,
  runOnce,
  getSportId,
  geocodeLocation,
  parseArbiterEventText
};
