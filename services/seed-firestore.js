require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const SERVICE_ACCOUNT_PATH = process.env.FIREBASE_SERVICE_ACCOUNT || '';
const SCHOOL_ID = process.env.SCHOOL_ID || 'sugar-salem';
const EVENTS_PATH = path.resolve(__dirname, '../data/events.json');

function resolveServiceAccount(saPath) {
  if (!saPath) {
    throw new Error(
      'Service account file path not specified.\n' +
      'Set FIREBASE_SERVICE_ACCOUNT=c:\\path\\to\\serviceAccount.json in .env, or pass --sa="path/to/sa.json"'
    );
  }
  const resolved = path.resolve(saPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Service account file not found: ${resolved}`);
  }
  return require(resolved);
}

function parseArgs() {
  const flags = { sa: SERVICE_ACCOUNT_PATH, schoolId: SCHOOL_ID };
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg.startsWith('--sa=')) flags.sa = arg.slice(5);
    else if (arg === '--sa') flags.sa = process.argv[++i];
    else if (arg.startsWith('--school=')) flags.schoolId = arg.slice(9);
    else if (arg === '--school') flags.schoolId = process.argv[++i];
  }
  return flags;
}

function normalizeEventForFirestore(item, schoolId) {
  const homeScore = item.homeScore ?? item.ourScore ?? null;
  const awayScore = item.awayScore ?? item.oppScore ?? null;
  const sport = item.sport || '';
  const opponent = item.opponent || '';
  const locationType = item.locationType || item.homeAway || 'Home';
  const venueName = item.venueName || item.location || (locationType === 'Home' ? 'Sugar-Salem High School' : (opponent ? `${opponent} High School` : ''));
  const venueAddress = item.venueAddress || item.address || (locationType === 'Home' ? '#1 Digger Dr, Sugar City, ID 83448' : '');
  const time = item.startTime || item.time || 'TBA';
  const eventName = item.eventName || item.name || (opponent ? `${sport ? sport + ' ' : ''}${item.level || 'Varsity'} vs ${opponent}` : (sport ? `${sport} Event` : 'Event'));
  const status = item.status || (homeScore !== null && awayScore !== null ? 'Final' : 'Scheduled');

  return {
    id: String(item.id),
    sport,
    club: item.club || '',
    eventName,
    eventType: item.eventType || 'Game',
    gender: item.gender || 'Boys',
    level: item.level || 'Varsity',
    opponent,
    opponentMascot: item.opponentMascot || '',
    locationType,
    homeAway: locationType,
    date: item.date || '',
    time,
    startTime: time,
    endTime: item.endTime || '',
    venueName,
    location: venueName,
    venueAddress,
    address: venueAddress,
    lat: typeof item.lat === 'number' ? item.lat : (item.lat ? Number(item.lat) : 43.8744),
    lng: typeof item.lng === 'number' ? item.lng : (item.lng ? Number(item.lng) : -111.7483),
    parkingInfo: item.parkingInfo || 'Standard spectator parking available.',
    ticketUrl: item.ticketUrl || 'https://sugarsalemhighschool.arbiterwebsites.com/',
    description: item.description || '',
    ourScore: homeScore,
    oppScore: awayScore,
    homeScore,
    awayScore,
    status,
    highlights: item.highlights || '',
    stats: item.stats || null,
    schoolId: item.schoolId || schoolId
  };
}

async function main() {
  const { sa, schoolId } = parseArgs();

  console.log(`Configuring events in Firestore for school: ${schoolId}...`);
  if (!fs.existsSync(EVENTS_PATH)) {
    console.error(`Events file not found at ${EVENTS_PATH}`);
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(EVENTS_PATH, 'utf8'));
  const items = Array.isArray(raw) ? raw : (raw.events || []);
  console.log(`Loaded ${items.length} events from ${EVENTS_PATH}`);

  let saCredentials;
  try {
    saCredentials = resolveServiceAccount(sa);
  } catch (err) {
    console.warn(`\n[Notice] ${err.message}`);
    console.log(`\nNote: You can also easily sync events to Firestore directly inside the GameDay+ Admin Dashboard web interface at /admin.html using your admin login!\n`);
    process.exit(0);
  }

  initializeApp({ credential: cert(saCredentials) });
  const db = getFirestore();
  const collectionRef = db.collection('schools').doc(schoolId).collection('events');

  console.log(`Writing ${items.length} events to schools/${schoolId}/events in Firestore...`);
  const batchSize = 400;
  let currentBatch = db.batch();
  let count = 0;
  let totalSaved = 0;

  for (const item of items) {
    const docId = String(item.id || `evt-${Date.now()}-${count}`);
    const normalized = normalizeEventForFirestore(item, schoolId);
    currentBatch.set(collectionRef.doc(docId), {
      ...normalized,
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
    count++;
    totalSaved++;

    if (count >= batchSize) {
      await currentBatch.commit();
      console.log(`Committed batch of ${count} events... (${totalSaved}/${items.length})`);
      currentBatch = db.batch();
      count = 0;
    }
  }

  if (count > 0) {
    await currentBatch.commit();
    console.log(`Committed final batch of ${count} events.`);
  }

  console.log(`\nSuccessfully seeded ${totalSaved} events to Firestore for school "${schoolId}".`);
}

main().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
