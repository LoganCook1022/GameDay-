const fs = require('fs');
const https = require('https');
const path = require('path');

const PROJECT_ID = 'school-project-6dd54';

function getAccessToken() {
  const configPath = path.join(process.env.USERPROFILE, '.config', 'configstore', 'firebase-tools.json');
  if (!fs.existsSync(configPath)) {
    throw new Error('Firebase CLI configuration not found.');
  }
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const tokens = config.tokens || {};
  return tokens.access_token || (tokens.tokens && tokens.tokens.access_token);
}

// Convert a JS object into Firestore REST API value format
function toFirestoreValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function toFirestoreFields(obj) {
  const fields = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) fields[key] = toFirestoreValue(value);
  }
  return fields;
}

// School Definitions
const SCHOOLS = [
  {
    id: 'sugar-salem',
    name: 'Sugar-Salem High School',
    mascot: 'Diggers',
    primaryColor: '#1557b0',
    accentColor: '#f2b134',
    venueName: 'Sugar-Salem High School Stadium',
    venueAddress: '#1 Digger Dr, Sugar City, ID 83448',
    lat: 43.8744,
    lng: -111.7483,
    description: 'Home of the Sugar-Salem Diggers. 3A Mountain Rivers Conference champions in football, volleyball, and basketball.'
  },
  {
    id: 'south-fremont',
    name: 'South Fremont High School',
    mascot: 'Cougars',
    primaryColor: '#c8102e',
    accentColor: '#1e1e24',
    venueName: 'South Fremont High School Stadium',
    venueAddress: '850 N Bridge St, St Anthony, ID 83445',
    lat: 43.9749,
    lng: -111.6847,
    description: 'Home of the South Fremont Cougars. Proud tradition of athletic and academic excellence in St. Anthony, Idaho.'
  },
  {
    id: 'teton',
    name: 'Teton High School',
    mascot: 'Timberwolves',
    primaryColor: '#c4512d',
    accentColor: '#7d2735',
    venueName: 'Teton High School Stadium',
    venueAddress: '555 E Ross Ave, Driggs, ID 83422',
    lat: 43.7225,
    lng: -111.1033,
    description: 'Home of the Teton Timberwolves in scenic Teton Valley. High-altitude spirit, championship grit, and community pride.'
  },
  {
    id: 'snake-river',
    name: 'Snake River High School',
    mascot: 'Panthers',
    primaryColor: '#68449a',
    accentColor: '#28202f',
    venueName: 'Snake River High School Stadium',
    venueAddress: '922 S 700 W, Blackfoot, ID 83221',
    lat: 43.1672,
    lng: -112.4045,
    description: 'Home of the Snake River Panthers. Multi-time state champions located in Blackfoot, Idaho.'
  },
  {
    id: 'madison',
    name: 'Madison High School',
    mascot: 'Bobcats',
    primaryColor: '#b3202a',
    accentColor: '#1e2b52',
    venueName: 'Madison High School Stadium',
    venueAddress: '2300 University Blvd, Rexburg, ID 83440',
    lat: 43.8055,
    lng: -111.7981,
    description: 'Home of the Madison Bobcats. 5A powerhouse in athletics, academics, and the performing arts in Rexburg, Idaho.'
  },
  {
    id: 'rigby',
    name: 'Rigby High School',
    mascot: 'Trojans',
    primaryColor: '#c8102e',
    accentColor: '#172b4d',
    venueName: 'Rigby High School Trojan Stadium',
    venueAddress: '3850 E 300 N, Rigby, ID 83442',
    lat: 43.6811,
    lng: -111.8953,
    description: 'Home of the Rigby Trojans. Reigning 5A state power with Trojan Pride across Jefferson County.'
  }
];

const COMMON_SPORTS = [
  'Football', 'Volleyball', 'Soccer', 'Basketball', 'Wrestling',
  'Baseball', 'Softball', 'Track', 'Cross Country', 'Tennis'
];

const COMMON_CLUBS = [
  { name: 'Robotics Club', desc: 'FIRST Tech Challenge robotics team' },
  { name: 'Drama & Theater', desc: 'Fall play, spring musical, and one-act competitions' },
  { name: 'Debate & Speech', desc: 'Policy debate, Lincoln-Douglas, and speech team' },
  { name: 'Student Council (STUCO)', desc: 'Student government, assemblies, and spirit weeks' },
  { name: 'Chess Club', desc: 'Weekly chess tactics and interscholastic tournaments' }
];

function generateEventsForSchool(school) {
  const events = [];
  const otherSchools = SCHOOLS.filter(s => s.id !== school.id);
  const externalRivals = [
    { name: 'Kimberly High School', mascot: 'Bulldogs', addr: '141 Center St W, Kimberly, ID 83341', lat: 42.5332, lng: -114.3644 },
    { name: 'Marsh Valley High School', mascot: 'Eagles', addr: '12655 S Hwy 91, Arimo, ID 83214', lat: 42.5594, lng: -112.1755 },
    { name: 'Shelley High School', mascot: 'Russets', addr: '570 W Fir St, Shelley, ID 83274', lat: 43.3796, lng: -112.1311 },
    { name: 'American Falls High School', mascot: 'Beavers', addr: '2966 S Frontage Rd, American Falls, ID 83211', lat: 42.7844, lng: -112.8466 },
    { name: 'Fruitland High School', mascot: 'Grizzlies', addr: '501 S Iowa Ave, Fruitland, ID 83619', lat: 44.0094, lng: -116.9208 },
    { name: 'Highland High School', mascot: 'Rams', addr: '1800 Bench Rd, Pocatello, ID 83201', lat: 42.9066, lng: -112.4283 },
    { name: 'Idaho Falls High School', mascot: 'Tigers', addr: '601 S Holmes Ave, Idaho Falls, ID 83401', lat: 43.4883, lng: -112.0233 }
  ];

  // Helper date generator around current date (2026-08 to 2026-11)
  const scheduleDates = [
    { date: '2026-08-28', time: '7:00 PM', past: true },
    { date: '2026-09-04', time: '7:00 PM', past: true },
    { date: '2026-09-11', time: '7:00 PM', past: true },
    { date: '2026-09-18', time: '7:00 PM', past: true },
    { date: '2026-09-25', time: '7:00 PM', past: true },
    { date: '2026-10-02', time: '7:00 PM', past: true },
    { date: '2026-10-09', time: '7:00 PM', past: true },
    { date: '2026-10-16', time: '7:00 PM', past: false },
    { date: '2026-10-23', time: '7:00 PM', past: false },
    { date: '2026-10-30', time: '7:00 PM', past: false },
    { date: '2026-11-06', time: '7:00 PM', past: false },
    { date: '2026-11-13', time: '7:00 PM', past: false },
    { date: '2026-11-20', time: '7:00 PM', past: false },
    { date: '2026-11-27', time: '7:30 PM', past: false },
    { date: '2026-12-04', time: '7:30 PM', past: false },
    { date: '2026-12-11', time: '7:30 PM', past: false }
  ];

  let evtIndex = 1;

  // 1. Football Games (Varsity & JV)
  const footballOpponents = [...otherSchools, externalRivals[0], externalRivals[1], externalRivals[2]];
  footballOpponents.forEach((opp, i) => {
    const isHome = i % 2 === 0;
    const sched = scheduleDates[i % scheduleDates.length];
    const isPast = sched.past;
    const ourScore = isPast ? Math.floor(21 + Math.random() * 21) : null;
    const oppScore = isPast ? Math.floor(7 + Math.random() * 24) : null;
    const status = isPast ? 'Final' : 'Scheduled';

    events.push({
      id: `${school.id}-fb-${String(evtIndex++).padStart(3, '0')}`,
      schoolId: school.id,
      sport: 'Football',
      gender: 'Boys',
      level: 'Varsity',
      eventName: `${school.name} Varsity Football ${isHome ? 'vs' : 'at'} ${opp.name}`,
      eventType: 'Game',
      opponent: opp.name,
      opponentMascot: opp.mascot,
      locationType: isHome ? 'Home' : 'Away',
      date: sched.date,
      time: sched.time,
      startTime: sched.time,
      endTime: '9:30 PM',
      venueName: isHome ? school.venueName : (opp.venueName || `${opp.name} Stadium`),
      venueAddress: isHome ? school.venueAddress : (opp.venueAddress || opp.addr),
      lat: isHome ? school.lat : (opp.lat || school.lat),
      lng: isHome ? school.lng : (opp.lng || school.lng),
      homeScore: ourScore,
      awayScore: oppScore,
      ourScore: ourScore,
      oppScore: oppScore,
      status,
      highlights: isPast ? `Electric Friday Night Football clash between ${school.mascot} and ${opp.mascot}.` : `Key conference matchup under the Friday night lights.`,
      description: `Varsity football game between ${school.name} and ${opp.name}. Gates open 90 minutes before kickoff.`,
      parkingInfo: 'Main spectator lot and overflow student parking available.',
      ticketUrl: 'https://gofan.co/'
    });
  });

  // 2. Volleyball Matches
  const vbOpponents = [...otherSchools, externalRivals[1], externalRivals[3]];
  vbOpponents.forEach((opp, i) => {
    const isHome = (i + 1) % 2 === 0;
    const schedDate = `2026-09-${String(8 + i * 4).padStart(2, '0')}`;
    const isPast = schedDate <= '2026-10-13';
    const ourScore = isPast ? (Math.random() > 0.3 ? 3 : 1) : null;
    const oppScore = isPast ? (ourScore === 3 ? Math.floor(Math.random() * 2) : 3) : null;

    events.push({
      id: `${school.id}-vb-${String(evtIndex++).padStart(3, '0')}`,
      schoolId: school.id,
      sport: 'Volleyball',
      gender: 'Girls',
      level: 'Varsity',
      eventName: `${school.name} Varsity Volleyball ${isHome ? 'vs' : 'at'} ${opp.name}`,
      eventType: 'Game',
      opponent: opp.name,
      opponentMascot: opp.mascot,
      locationType: isHome ? 'Home' : 'Away',
      date: schedDate,
      time: '6:30 PM',
      startTime: '6:30 PM',
      endTime: '8:00 PM',
      venueName: isHome ? `${school.name} Main Gym` : `${opp.name} Gymnasium`,
      venueAddress: isHome ? school.venueAddress : (opp.venueAddress || opp.addr),
      lat: isHome ? school.lat : (opp.lat || school.lat),
      lng: isHome ? school.lng : (opp.lng || school.lng),
      homeScore: ourScore,
      awayScore: oppScore,
      ourScore,
      oppScore,
      status: isPast ? 'Final' : 'Scheduled',
      highlights: isPast ? `Intense conference volleyball battle with high-flying spikes and digs.` : `Conference volleyball showdown.`,
      description: `Girls varsity volleyball game. JV plays beforehand at 5:00 PM.`,
      ticketUrl: 'https://gofan.co/'
    });
  });

  // 3. Soccer Games (Boys & Girls)
  const soccerOpponents = [...otherSchools.slice(0, 4), externalRivals[2]];
  soccerOpponents.forEach((opp, i) => {
    const isHome = i % 2 === 0;
    const schedDate = `2026-09-${String(10 + i * 5).padStart(2, '0')}`;
    const isPast = schedDate <= '2026-10-13';
    const ourScore = isPast ? Math.floor(1 + Math.random() * 4) : null;
    const oppScore = isPast ? Math.floor(Math.random() * 3) : null;

    events.push({
      id: `${school.id}-sc-${String(evtIndex++).padStart(3, '0')}`,
      schoolId: school.id,
      sport: 'Soccer',
      gender: i % 2 === 0 ? 'Boys' : 'Girls',
      level: 'Varsity',
      eventName: `${school.name} ${i % 2 === 0 ? 'Boys' : 'Girls'} Soccer ${isHome ? 'vs' : 'at'} ${opp.name}`,
      eventType: 'Game',
      opponent: opp.name,
      opponentMascot: opp.mascot,
      locationType: isHome ? 'Home' : 'Away',
      date: schedDate,
      time: '4:30 PM',
      startTime: '4:30 PM',
      endTime: '6:15 PM',
      venueName: isHome ? `${school.name} Soccer Field` : `${opp.name} Soccer Complex`,
      venueAddress: isHome ? school.venueAddress : (opp.venueAddress || opp.addr),
      lat: isHome ? school.lat : (opp.lat || school.lat),
      lng: isHome ? school.lng : (opp.lng || school.lng),
      homeScore: ourScore,
      awayScore: oppScore,
      ourScore,
      oppScore,
      status: isPast ? 'Final' : 'Scheduled',
      highlights: isPast ? `Conference soccer duel on the pitch.` : `Key district points on the line.`,
      description: `Varsity soccer match between ${school.name} and ${opp.name}.`,
      ticketUrl: 'https://gofan.co/'
    });
  });

  // 4. Basketball Games (Upcoming Winter Season)
  const bballOpponents = [...otherSchools, externalRivals[0], externalRivals[4]];
  bballOpponents.forEach((opp, i) => {
    const isHome = i % 2 === 1;
    const schedDate = `2026-11-${String(17 + i * 3).padStart(2, '0')}`;

    events.push({
      id: `${school.id}-bb-${String(evtIndex++).padStart(3, '0')}`,
      schoolId: school.id,
      sport: 'Basketball',
      gender: i % 2 === 0 ? 'Boys' : 'Girls',
      level: 'Varsity',
      eventName: `${school.name} ${i % 2 === 0 ? 'Boys' : 'Girls'} Basketball ${isHome ? 'vs' : 'at'} ${opp.name}`,
      eventType: 'Game',
      opponent: opp.name,
      opponentMascot: opp.mascot,
      locationType: isHome ? 'Home' : 'Away',
      date: schedDate,
      time: '7:30 PM',
      startTime: '7:30 PM',
      endTime: '9:00 PM',
      venueName: isHome ? `${school.name} Main Arena` : `${opp.name} Gym`,
      venueAddress: isHome ? school.venueAddress : (opp.venueAddress || opp.addr),
      lat: isHome ? school.lat : (opp.lat || school.lat),
      lng: isHome ? school.lng : (opp.lng || school.lng),
      homeScore: null,
      awayScore: null,
      ourScore: null,
      oppScore: null,
      status: 'Scheduled',
      highlights: `Upcoming winter basketball rivalry night.`,
      description: `Varsity basketball action. Student section theme: Whiteout.`,
      ticketUrl: 'https://gofan.co/'
    });
  });

  // 5. School Activities & Clubs
  const clubEvents = [
    { name: 'Fall Drama Production: The Crucible', type: 'Drama', date: '2026-10-22', time: '7:00 PM', loc: `${school.name} Performing Arts Auditorium` },
    { name: 'Robotics Team Regional Build Day', type: 'Robotics', date: '2026-10-24', time: '9:00 AM', loc: `${school.name} STEM Workshop` },
    { name: 'Homecoming Parade & Pep Rally', type: 'Student Council', date: '2026-10-02', time: '2:30 PM', loc: `${school.name} Main Stadium` },
    { name: 'Interscholastic Debate Invitationals', type: 'Debate', date: '2026-11-07', time: '8:00 AM', loc: `${school.name} Academic Wing` },
    { name: 'District Chess Championship', type: 'Chess Club', date: '2026-11-14', time: '10:00 AM', loc: `${school.name} Media Center` }
  ];

  clubEvents.forEach((ce, i) => {
    const isPast = ce.date <= '2026-10-13';
    events.push({
      id: `${school.id}-act-${String(evtIndex++).padStart(3, '0')}`,
      schoolId: school.id,
      sport: 'Other',
      club: ce.type,
      eventName: ce.name,
      eventType: 'Club Meeting',
      opponent: '',
      opponentMascot: '',
      locationType: 'Home',
      date: ce.date,
      time: ce.time,
      startTime: ce.time,
      endTime: '8:30 PM',
      venueName: ce.loc,
      venueAddress: school.venueAddress,
      lat: school.lat,
      lng: school.lng,
      homeScore: null,
      awayScore: null,
      ourScore: null,
      oppScore: null,
      status: isPast ? 'Completed' : 'Scheduled',
      highlights: `${ce.type} event showcasing talented ${school.mascot} students.`,
      description: `Open to all students, parents, and community members.`,
      ticketUrl: ''
    });
  });

  return events;
}

async function sendBatchCommit(token, writes) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ writes });
    const req = https.request(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:commit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(body || '{}'));
        } else {
          reject(new Error(`Batch commit failed (${res.statusCode}): ${body}`));
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('=== GameDay+ Multi-School Firestore Seeder ===\n');
  const token = getAccessToken();
  console.log('Obtained Google OAuth token from Firebase CLI.\n');

  const allEventsForJson = [];
  const writes = [];

  for (const school of SCHOOLS) {
    console.log(`Preparing data for: ${school.name} (${school.id})...`);

    // 1. School settings
    const settingsPath = `projects/${PROJECT_ID}/databases/(default)/documents/schools/${school.id}/settings/school`;
    writes.push({
      update: {
        name: settingsPath,
        fields: toFirestoreFields({
          schoolName: school.name,
          mascot: school.mascot,
          primaryColor: school.primaryColor,
          accentColor: school.accentColor,
          venueName: school.venueName,
          venueAddress: school.venueAddress,
          lat: school.lat,
          lng: school.lng,
          description: school.description,
          updatedAt: new Date().toISOString()
        })
      }
    });

    // 2. Sports
    COMMON_SPORTS.forEach(sportName => {
      const sportDocPath = `projects/${PROJECT_ID}/databases/(default)/documents/schools/${school.id}/sports/${sportName.toLowerCase().replace(/\s+/g, '-')}`;
      writes.push({
        update: {
          name: sportDocPath,
          fields: toFirestoreFields({
            name: sportName,
            enabled: true,
            schoolId: school.id
          })
        }
      });
    });

    // 3. Clubs
    COMMON_CLUBS.forEach(club => {
      const clubDocPath = `projects/${PROJECT_ID}/databases/(default)/documents/schools/${school.id}/clubs/${club.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      writes.push({
        update: {
          name: clubDocPath,
          fields: toFirestoreFields({
            name: club.name,
            description: club.desc,
            enabled: true,
            schoolId: school.id
          })
        }
      });
    });

    // 4. Generate & store events
    const schoolEvents = generateEventsForSchool(school);
    console.log(`  Generated ${schoolEvents.length} games & events.`);
    schoolEvents.forEach(evt => {
      allEventsForJson.push(evt);
      const eventDocPath = `projects/${PROJECT_ID}/databases/(default)/documents/schools/${school.id}/events/${evt.id}`;
      writes.push({
        update: {
          name: eventDocPath,
          fields: toFirestoreFields(evt)
        }
      });
    });
  }

  console.log(`\nTotal Firestore writes prepared: ${writes.length}`);
  console.log('Sending batch commits to Firestore in chunks of 350 writes...');

  const chunkSize = 350;
  for (let i = 0; i < writes.length; i += chunkSize) {
    const chunk = writes.slice(i, i + chunkSize);
    process.stdout.write(`  Committing writes ${i + 1} to ${Math.min(i + chunkSize, writes.length)}... `);
    await sendBatchCommit(token, chunk);
    console.log('Done.');
  }

  console.log('\nAll schools seeded to Firestore successfully!');

  // Also update data/events.json so local fallback has all schools
  const eventsJsonPath = path.resolve(__dirname, '../data/events.json');
  fs.writeFileSync(eventsJsonPath, JSON.stringify({ events: allEventsForJson }, null, 2), 'utf8');
  console.log(`Updated data/events.json with ${allEventsForJson.length} multi-school events.`);
}

main().catch(err => {
  console.error('\nSeeder Error:', err);
  process.exit(1);
});
