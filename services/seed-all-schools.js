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

// Comprehensive School Metadata
const SCHOOLS = [
  {
    id: 'sugar-salem',
    name: 'Sugar-Salem High School',
    mascot: 'Diggers',
    primaryColor: '#1557b0',
    accentColor: '#f2b134',
    venueName: 'Sugar-Salem High School Stadium',
    gymName: 'Sugar-Salem Digger Gymnasium',
    soccerName: 'Sugar-Salem Soccer Complex',
    baseballName: 'Sugar-Salem Digger Diamond',
    auditoriumName: 'Sugar-Salem Performing Arts Auditorium',
    venueAddress: '#1 Digger Dr, Sugar City, ID 83448',
    lat: 43.8744,
    lng: -111.7483,
    ticketUrl: 'https://sugarsalemhighschool.arbiterwebsites.com/',
    description: 'Home of the Sugar-Salem Diggers. 3A Mountain Rivers Conference powerhouse with state championships in football, volleyball, basketball, and cross country.'
  },
  {
    id: 'south-fremont',
    name: 'South Fremont High School',
    mascot: 'Cougars',
    primaryColor: '#c8102e',
    accentColor: '#1e1e24',
    venueName: 'South Fremont High School Stadium',
    gymName: 'South Fremont Cougar Arena',
    soccerName: 'Cougar Soccer Field',
    baseballName: 'Cougar Baseball Field',
    auditoriumName: 'South Fremont Performing Arts Center',
    venueAddress: '850 N Bridge St, St Anthony, ID 83445',
    lat: 43.9749,
    lng: -111.6847,
    ticketUrl: 'https://gofan.co/',
    description: 'Home of the South Fremont Cougars. Proud tradition of athletic grit and academic excellence in St. Anthony, Idaho.'
  },
  {
    id: 'teton',
    name: 'Teton High School',
    mascot: 'Timberwolves',
    primaryColor: '#c4512d',
    accentColor: '#7d2735',
    venueName: 'Teton High School Stadium',
    gymName: 'Teton Timberwolf Den Gym',
    soccerName: 'Teton Valley Soccer Field',
    baseballName: 'Timberwolf Ballpark',
    auditoriumName: 'Teton Valley Community Auditorium',
    venueAddress: '555 E Ross Ave, Driggs, ID 83422',
    lat: 43.7225,
    lng: -111.1033,
    ticketUrl: 'https://gofan.co/',
    description: 'Home of the Teton Timberwolves in scenic Teton Valley. High-altitude spirit, championship culture, and strong community support.'
  },
  {
    id: 'snake-river',
    name: 'Snake River High School',
    mascot: 'Panthers',
    primaryColor: '#68449a',
    accentColor: '#28202f',
    venueName: 'Snake River High School Stadium',
    gymName: 'Snake River Panther Dome Gym',
    soccerName: 'Snake River Soccer Complex',
    baseballName: 'Panther Field',
    auditoriumName: 'Snake River Community Auditorium',
    venueAddress: '922 S 700 W, Blackfoot, ID 83221',
    lat: 43.1672,
    lng: -112.4045,
    ticketUrl: 'https://gofan.co/',
    description: 'Home of the Snake River Panthers. Multi-time Idaho state champions in football, basketball, and track in Blackfoot, Idaho.'
  },
  {
    id: 'madison',
    name: 'Madison High School',
    mascot: 'Bobcats',
    primaryColor: '#b3202a',
    accentColor: '#1e2b52',
    venueName: 'Madison High School Stadium',
    gymName: 'Madison Bobcat Fieldhouse & Arena',
    soccerName: 'Madison Soccer Complex',
    baseballName: 'Bobcat Ballpark',
    auditoriumName: 'Madison Performing Arts Center',
    venueAddress: '2300 University Blvd, Rexburg, ID 83440',
    lat: 43.8055,
    lng: -111.7981,
    ticketUrl: 'https://gofan.co/',
    description: 'Home of the Madison Bobcats. 5A powerhouse in athletics, academics, marching band, and performing arts in Rexburg, Idaho.'
  },
  {
    id: 'rigby',
    name: 'Rigby High School',
    mascot: 'Trojans',
    primaryColor: '#c8102e',
    accentColor: '#172b4d',
    venueName: 'Rigby High School Trojan Stadium',
    gymName: 'Rigby Trojan Fieldhouse',
    soccerName: 'Rigby Soccer Complex',
    baseballName: 'Trojan Diamond',
    auditoriumName: 'Rigby High Performing Arts Auditorium',
    venueAddress: '3850 E 300 N, Rigby, ID 83442',
    lat: 43.6811,
    lng: -111.8953,
    ticketUrl: 'https://gofan.co/',
    description: 'Home of the Rigby Trojans. Reigning 5A state power with Trojan Pride across Jefferson County.'
  }
];

const COMMON_SPORTS = [
  'Football', 'Volleyball', 'Soccer', 'Basketball', 'Wrestling',
  'Baseball', 'Softball', 'Track', 'Cross Country', 'Tennis'
];

const COMMON_CLUBS = [
  { name: 'Robotics Club', desc: 'FIRST Tech Challenge robotics engineering & competitive team' },
  { name: 'Drama & Theater', desc: 'Fall play, spring musical, and district one-act competitions' },
  { name: 'Debate & Speech', desc: 'Policy debate, Lincoln-Douglas, and competitive speech team' },
  { name: 'Student Council (STUCO)', desc: 'Student government, pep rallies, spirit weeks, and assemblies' },
  { name: 'National Honor Society', desc: 'Scholarship, leadership, service, and character honor society' },
  { name: 'FFA (Future Farmers)', desc: 'Agricultural leadership, livestock expo, and community service' },
  { name: 'Chess Club', desc: 'Weekly chess tactics and interscholastic tournaments' },
  { name: 'Cheer & Dance', desc: 'Varsity cheerleading squad and competition drill/dance team' }
];

const EXTERNAL_RIVALS = [
  { name: 'Kimberly High School', mascot: 'Bulldogs', addr: '141 Center St W, Kimberly, ID 83341', lat: 42.5332, lng: -114.3644 },
  { name: 'Marsh Valley High School', mascot: 'Eagles', addr: '12655 S Hwy 91, Arimo, ID 83214', lat: 42.5594, lng: -112.1755 },
  { name: 'Shelley High School', mascot: 'Russets', addr: '570 W Fir St, Shelley, ID 83274', lat: 43.3796, lng: -112.1311 },
  { name: 'American Falls High School', mascot: 'Beavers', addr: '2966 S Frontage Rd, American Falls, ID 83211', lat: 42.7844, lng: -112.8466 },
  { name: 'Highland High School', mascot: 'Rams', addr: '1800 Bench Rd, Pocatello, ID 83201', lat: 42.9066, lng: -112.4283 },
  { name: 'Idaho Falls High School', mascot: 'Tigers', addr: '601 S Holmes Ave, Idaho Falls, ID 83401', lat: 43.4883, lng: -112.0233 },
  { name: 'Skyline High School', mascot: 'Grizzlies', addr: '1767 S Boulevard, Idaho Falls, ID 83402', lat: 43.4735, lng: -112.0475 },
  { name: 'Bonneville High School', mascot: 'Bees', addr: '3165 E Iona Rd, Idaho Falls, ID 83401', lat: 43.5255, lng: -111.9705 },
  { name: 'Thunder Ridge High School', mascot: 'Titans', addr: '4941 1st St, Idaho Falls, ID 83401', lat: 43.5280, lng: -111.9210 },
  { name: 'Blackfoot High School', mascot: 'Broncos', addr: '870 S Fisher Ave, Blackfoot, ID 83221', lat: 43.1818, lng: -112.3392 }
];

function generateEventsForSchool(school) {
  const events = [];
  const otherSchools = SCHOOLS.filter(s => s.id !== school.id);
  let evtIndex = 1;

  // 1. VARSITY FOOTBALL (10 Games: Aug 28 - Oct 30)
  const fbOpponents = [
    otherSchools[0], otherSchools[1], otherSchools[2], otherSchools[3], otherSchools[4],
    EXTERNAL_RIVALS[0], EXTERNAL_RIVALS[1], EXTERNAL_RIVALS[2], EXTERNAL_RIVALS[3], EXTERNAL_RIVALS[4]
  ];
  const fbDates = [
    { date: '2026-08-28', time: '7:00 PM', past: true, ourScore: 35, oppScore: 14 },
    { date: '2026-09-04', time: '7:00 PM', past: true, ourScore: 28, oppScore: 21 },
    { date: '2026-09-11', time: '7:00 PM', past: true, ourScore: 42, oppScore: 7 },
    { date: '2026-09-18', time: '7:00 PM', past: true, ourScore: 24, oppScore: 27 },
    { date: '2026-09-25', time: '7:00 PM', past: true, ourScore: 31, oppScore: 17 },
    { date: '2026-10-02', time: '7:00 PM', past: true, ourScore: 38, oppScore: 10 },
    { date: '2026-10-09', time: '7:00 PM', past: true, ourScore: 21, oppScore: 14 },
    { date: '2026-10-16', time: '7:00 PM', past: false },
    { date: '2026-10-23', time: '7:00 PM', past: false },
    { date: '2026-10-30', time: '7:00 PM', past: false }
  ];

  fbOpponents.forEach((opp, i) => {
    const isHome = i % 2 === 0;
    const sched = fbDates[i];
    const isPast = sched.past;
    const ourScore = isPast ? sched.ourScore : null;
    const oppScore = isPast ? sched.oppScore : null;

    events.push({
      id: `${school.id}-fb-v-${String(evtIndex++).padStart(3, '0')}`,
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
      endTime: '9:45 PM',
      venueName: isHome ? school.venueName : (opp.venueName || `${opp.name} Stadium`),
      venueAddress: isHome ? school.venueAddress : (opp.venueAddress || opp.addr),
      lat: isHome ? school.lat : (opp.lat || school.lat),
      lng: isHome ? school.lng : (opp.lng || school.lng),
      homeScore: ourScore,
      awayScore: oppScore,
      ourScore,
      oppScore,
      status: isPast ? 'Final' : 'Scheduled',
      highlights: isPast ? `Friday night conference battle between ${school.mascot} and ${opp.mascot}. Hard-hitting defensive stops and dynamic offensive execution.` : `Crucial conference matchup under the Friday night lights. Kickoff at 7:00 PM.`,
      description: `Varsity football game between ${school.name} and ${opp.name}. Gates open 90 minutes before kickoff. Broadcast available on IdahoSports.com.`,
      parkingInfo: 'Main spectator parking west lot. Overflow student parking at field entrance.',
      ticketUrl: school.ticketUrl
    });
  });

  // 2. JV FOOTBALL (5 Games: Thursdays at 4:30 PM)
  const jvFbOpponents = [otherSchools[0], otherSchools[1], otherSchools[2], EXTERNAL_RIVALS[0], EXTERNAL_RIVALS[2]];
  const jvFbDates = [
    { date: '2026-09-03', time: '4:30 PM', past: true, ourScore: 21, oppScore: 12 },
    { date: '2026-09-17', time: '4:30 PM', past: true, ourScore: 28, oppScore: 20 },
    { date: '2026-10-01', time: '4:30 PM', past: true, ourScore: 14, oppScore: 7 },
    { date: '2026-10-15', time: '4:30 PM', past: false },
    { date: '2026-10-22', time: '4:30 PM', past: false }
  ];
  jvFbOpponents.forEach((opp, i) => {
    const isHome = i % 2 === 1;
    const sched = jvFbDates[i];
    events.push({
      id: `${school.id}-fb-jv-${String(evtIndex++).padStart(3, '0')}`,
      schoolId: school.id,
      sport: 'Football',
      gender: 'Boys',
      level: 'JV',
      eventName: `${school.name} Junior Varsity Football ${isHome ? 'vs' : 'at'} ${opp.name}`,
      eventType: 'Game',
      opponent: opp.name,
      opponentMascot: opp.mascot,
      locationType: isHome ? 'Home' : 'Away',
      date: sched.date,
      time: sched.time,
      startTime: sched.time,
      endTime: '6:30 PM',
      venueName: isHome ? school.venueName : (opp.venueName || `${opp.name} Stadium`),
      venueAddress: isHome ? school.venueAddress : (opp.venueAddress || opp.addr),
      lat: isHome ? school.lat : (opp.lat || school.lat),
      lng: isHome ? school.lng : (opp.lng || school.lng),
      homeScore: sched.past ? sched.ourScore : null,
      awayScore: sched.past ? sched.oppScore : null,
      ourScore: sched.past ? sched.ourScore : null,
      oppScore: sched.past ? sched.oppScore : null,
      status: sched.past ? 'Final' : 'Scheduled',
      highlights: `Junior Varsity clash showcasing the future varsity stars.`,
      description: `JV football contest between ${school.name} and ${opp.name}. Free admission for students with activity card.`,
      parkingInfo: 'Standard campus lot parking.',
      ticketUrl: school.ticketUrl
    });
  });

  // 3. GIRLS VOLLEYBALL (Varsity & JV: Sept - Oct)
  const vbOpponents = [otherSchools[0], otherSchools[1], otherSchools[2], otherSchools[3], EXTERNAL_RIVALS[1], EXTERNAL_RIVALS[3], EXTERNAL_RIVALS[5], EXTERNAL_RIVALS[6]];
  const vbDates = [
    { date: '2026-09-01', time: '6:30 PM', past: true, ourScore: 3, oppScore: 1 },
    { date: '2026-09-08', time: '6:30 PM', past: true, ourScore: 3, oppScore: 0 },
    { date: '2026-09-15', time: '6:30 PM', past: true, ourScore: 2, oppScore: 3 },
    { date: '2026-09-22', time: '6:30 PM', past: true, ourScore: 3, oppScore: 2 },
    { date: '2026-09-29', time: '6:30 PM', past: true, ourScore: 3, oppScore: 1 },
    { date: '2026-10-06', time: '6:30 PM', past: true, ourScore: 3, oppScore: 0 },
    { date: '2026-10-13', time: '6:30 PM', past: true, ourScore: 3, oppScore: 2 },
    { date: '2026-10-20', time: '6:30 PM', past: false }
  ];
  vbOpponents.forEach((opp, i) => {
    const isHome = i % 2 === 0;
    const sched = vbDates[i];
    events.push({
      id: `${school.id}-vb-v-${String(evtIndex++).padStart(3, '0')}`,
      schoolId: school.id,
      sport: 'Volleyball',
      gender: 'Girls',
      level: 'Varsity',
      eventName: `${school.name} Varsity Volleyball ${isHome ? 'vs' : 'at'} ${opp.name}`,
      eventType: 'Game',
      opponent: opp.name,
      opponentMascot: opp.mascot,
      locationType: isHome ? 'Home' : 'Away',
      date: sched.date,
      time: sched.time,
      startTime: sched.time,
      endTime: '8:00 PM',
      venueName: isHome ? school.gymName : `${opp.name} Gymnasium`,
      venueAddress: isHome ? school.venueAddress : (opp.venueAddress || opp.addr),
      lat: isHome ? school.lat : (opp.lat || school.lat),
      lng: isHome ? school.lng : (opp.lng || school.lng),
      homeScore: sched.past ? sched.ourScore : null,
      awayScore: sched.past ? sched.oppScore : null,
      ourScore: sched.past ? sched.ourScore : null,
      oppScore: sched.past ? sched.oppScore : null,
      status: sched.past ? 'Final' : 'Scheduled',
      highlights: sched.past ? `Electrifying 5-set rally volleyball match with high-flying spikes, blocks, and clutch digs.` : `High-stakes conference volleyball match.`,
      description: `Girls varsity volleyball match. JV match begins at 5:00 PM beforehand.`,
      parkingInfo: 'Main gymnasium parking lot.',
      ticketUrl: school.ticketUrl
    });
  });

  // 4. BOYS & GIRLS SOCCER (Aug - Oct)
  const soccerOpponents = [otherSchools[0], otherSchools[1], otherSchools[2], otherSchools[3], EXTERNAL_RIVALS[5], EXTERNAL_RIVALS[6]];
  soccerOpponents.forEach((opp, i) => {
    // Boys soccer
    const bIsHome = i % 2 === 0;
    const bDate = `2026-09-${String(5 + i * 5).padStart(2, '0')}`;
    const bIsPast = bDate <= '2026-10-13';
    events.push({
      id: `${school.id}-sc-b-${String(evtIndex++).padStart(3, '0')}`,
      schoolId: school.id,
      sport: 'Soccer',
      gender: 'Boys',
      level: 'Varsity',
      eventName: `${school.name} Boys Varsity Soccer ${bIsHome ? 'vs' : 'at'} ${opp.name}`,
      eventType: 'Game',
      opponent: opp.name,
      opponentMascot: opp.mascot,
      locationType: bIsHome ? 'Home' : 'Away',
      date: bDate,
      time: '4:30 PM',
      startTime: '4:30 PM',
      endTime: '6:15 PM',
      venueName: bIsHome ? school.soccerName : `${opp.name} Soccer Field`,
      venueAddress: bIsHome ? school.venueAddress : (opp.venueAddress || opp.addr),
      lat: bIsHome ? school.lat : (opp.lat || school.lat),
      lng: bIsHome ? school.lng : (opp.lng || school.lng),
      homeScore: bIsPast ? Math.floor(1 + Math.random() * 4) : null,
      awayScore: bIsPast ? Math.floor(Math.random() * 2) : null,
      ourScore: bIsPast ? 3 : null,
      oppScore: bIsPast ? 1 : null,
      status: bIsPast ? 'Final' : 'Scheduled',
      highlights: bIsPast ? `High paced offensive possession and solid defensive backline performance.` : `District conference match on the pitch.`,
      description: `Boys Varsity soccer. 80 minutes regulation play plus stoppage time.`,
      parkingInfo: 'Spectator parking by sports complex.',
      ticketUrl: school.ticketUrl
    });

    // Girls soccer
    const gIsHome = i % 2 === 1;
    const gDate = `2026-09-${String(7 + i * 5).padStart(2, '0')}`;
    const gIsPast = gDate <= '2026-10-13';
    events.push({
      id: `${school.id}-sc-g-${String(evtIndex++).padStart(3, '0')}`,
      schoolId: school.id,
      sport: 'Soccer',
      gender: 'Girls',
      level: 'Varsity',
      eventName: `${school.name} Girls Varsity Soccer ${gIsHome ? 'vs' : 'at'} ${opp.name}`,
      eventType: 'Game',
      opponent: opp.name,
      opponentMascot: opp.mascot,
      locationType: gIsHome ? 'Home' : 'Away',
      date: gDate,
      time: '4:30 PM',
      startTime: '4:30 PM',
      endTime: '6:15 PM',
      venueName: gIsHome ? school.soccerName : `${opp.name} Soccer Field`,
      venueAddress: gIsHome ? school.venueAddress : (opp.venueAddress || opp.addr),
      lat: gIsHome ? school.lat : (opp.lat || school.lat),
      lng: gIsHome ? school.lng : (opp.lng || school.lng),
      homeScore: gIsPast ? Math.floor(2 + Math.random() * 3) : null,
      awayScore: gIsPast ? Math.floor(Math.random() * 2) : null,
      ourScore: gIsPast ? 2 : null,
      oppScore: gIsPast ? 0 : null,
      status: gIsPast ? 'Final' : 'Scheduled',
      highlights: gIsPast ? `Dominant clean sheet defensive shutout with attacking transition goals.` : `Key district points on the line.`,
      description: `Girls Varsity soccer. Spectators encouraged to bring lawn chairs.`,
      parkingInfo: 'Spectator parking by sports complex.',
      ticketUrl: school.ticketUrl
    });
  });

  // 5. CROSS COUNTRY (Aug - Oct)
  const xcMeets = [
    { name: 'Tiger-Grizz Cross Country Invitational', date: '2026-09-12', time: '9:00 AM', loc: 'Freeman Park, Idaho Falls, ID', lat: 43.5132, lng: -112.0298, past: true, highlights: `${school.mascot} varsity runners posted multiple top-10 individual PRs.` },
    { name: 'Bobcat Cross Country Classic', date: '2026-09-26', time: '10:00 AM', loc: 'Madison High School Cross Country Course', lat: 43.8055, lng: -111.7981, past: true, highlights: `Strong team finish on a brisk morning 5K course.` },
    { name: 'Mountain Rivers Conference XC Championship', date: '2026-10-15', time: '3:30 PM', loc: `${school.name} Cross Country Course`, lat: school.lat, lng: school.lng, past: false, highlights: `District championship meet deciding state qualifying teams.` },
    { name: 'Idaho State Cross Country Championship', date: '2026-10-31', time: '11:00 AM', loc: 'Eagle Island State Park, Eagle, ID', lat: 43.6931, lng: -116.4024, past: false, highlights: `Season finale 5K state title race with the best runners in Idaho.` }
  ];
  xcMeets.forEach((meet, i) => {
    events.push({
      id: `${school.id}-xc-${String(evtIndex++).padStart(3, '0')}`,
      schoolId: school.id,
      sport: 'Cross Country',
      gender: 'Coed',
      level: 'Varsity',
      eventName: `${school.name} Cross Country at ${meet.name}`,
      eventType: 'Tournament',
      opponent: 'Multi-School Invitational',
      opponentMascot: 'Various',
      locationType: meet.loc.includes(school.name) ? 'Home' : 'Away',
      date: meet.date,
      time: meet.time,
      startTime: meet.time,
      endTime: '1:00 PM',
      venueName: meet.loc,
      venueAddress: meet.loc,
      lat: meet.lat,
      lng: meet.lng,
      homeScore: null,
      awayScore: null,
      ourScore: null,
      oppScore: null,
      status: meet.past ? 'Final' : 'Scheduled',
      highlights: meet.highlights,
      description: `Varsity and JV 5,000 meter cross country championship race.`,
      parkingInfo: 'Park in designated public spectator lots.',
      ticketUrl: ''
    });
  });

  // 6. BOYS BASKETBALL (Winter Season: Nov - Feb)
  const bballOpponents = [otherSchools[0], otherSchools[1], otherSchools[2], otherSchools[3], otherSchools[4], EXTERNAL_RIVALS[0], EXTERNAL_RIVALS[1], EXTERNAL_RIVALS[5]];
  const bbDates = [
    { date: '2026-11-24', time: '7:30 PM' },
    { date: '2026-12-01', time: '7:30 PM' },
    { date: '2026-12-08', time: '7:30 PM' },
    { date: '2026-12-15', time: '7:30 PM' },
    { date: '2027-01-08', time: '7:30 PM' },
    { date: '2027-01-15', time: '7:30 PM' },
    { date: '2027-01-22', time: '7:30 PM' },
    { date: '2027-01-29', time: '7:30 PM' }
  ];
  bballOpponents.forEach((opp, i) => {
    const isHome = i % 2 === 0;
    const sched = bbDates[i];
    events.push({
      id: `${school.id}-bb-b-v-${String(evtIndex++).padStart(3, '0')}`,
      schoolId: school.id,
      sport: 'Basketball',
      gender: 'Boys',
      level: 'Varsity',
      eventName: `${school.name} Boys Varsity Basketball ${isHome ? 'vs' : 'at'} ${opp.name}`,
      eventType: 'Game',
      opponent: opp.name,
      opponentMascot: opp.mascot,
      locationType: isHome ? 'Home' : 'Away',
      date: sched.date,
      time: sched.time,
      startTime: sched.time,
      endTime: '9:00 PM',
      venueName: isHome ? school.gymName : `${opp.name} Gym`,
      venueAddress: isHome ? school.venueAddress : (opp.venueAddress || opp.addr),
      lat: isHome ? school.lat : (opp.lat || school.lat),
      lng: isHome ? school.lng : (opp.lng || school.lng),
      homeScore: null,
      awayScore: null,
      ourScore: null,
      oppScore: null,
      status: 'Scheduled',
      highlights: `High-octane winter basketball rivalry clash. Pack the stands in school colors!`,
      description: `Boys Varsity basketball. Sophomore game at 4:30 PM, JV game at 6:00 PM, Varsity tips off at 7:30 PM.`,
      parkingInfo: 'Main gym entrance parking.',
      ticketUrl: school.ticketUrl
    });
  });

  // 7. GIRLS BASKETBALL (Winter Season: Nov - Feb)
  const gbbDates = [
    { date: '2026-11-20', time: '7:30 PM' },
    { date: '2026-11-27', time: '7:30 PM' },
    { date: '2026-12-04', time: '7:30 PM' },
    { date: '2026-12-11', time: '7:30 PM' },
    { date: '2027-01-05', time: '7:30 PM' },
    { date: '2027-01-12', time: '7:30 PM' },
    { date: '2027-01-19', time: '7:30 PM' },
    { date: '2027-01-26', time: '7:30 PM' }
  ];
  bballOpponents.forEach((opp, i) => {
    const isHome = i % 2 === 1;
    const sched = gbbDates[i];
    events.push({
      id: `${school.id}-bb-g-v-${String(evtIndex++).padStart(3, '0')}`,
      schoolId: school.id,
      sport: 'Basketball',
      gender: 'Girls',
      level: 'Varsity',
      eventName: `${school.name} Girls Varsity Basketball ${isHome ? 'vs' : 'at'} ${opp.name}`,
      eventType: 'Game',
      opponent: opp.name,
      opponentMascot: opp.mascot,
      locationType: isHome ? 'Home' : 'Away',
      date: sched.date,
      time: sched.time,
      startTime: sched.time,
      endTime: '9:00 PM',
      venueName: isHome ? school.gymName : `${opp.name} Gym`,
      venueAddress: isHome ? school.venueAddress : (opp.venueAddress || opp.addr),
      lat: isHome ? school.lat : (opp.lat || school.lat),
      lng: isHome ? school.lng : (opp.lng || school.lng),
      homeScore: null,
      awayScore: null,
      ourScore: null,
      oppScore: null,
      status: 'Scheduled',
      highlights: `Girls conference basketball matchup featuring fast-break offense and lock-down defense.`,
      description: `Girls Varsity basketball matchup. JV game precedes at 6:00 PM.`,
      parkingInfo: 'Main gym entrance parking.',
      ticketUrl: school.ticketUrl
    });
  });

  // 8. WRESTLING (Dec - Feb)
  const wrestlingEvents = [
    { name: `${school.mascot} Wrestling Dual vs ${otherSchools[0].name}`, opp: otherSchools[0], date: '2026-12-03', time: '6:00 PM', home: true },
    { name: `Cougar & Digger Dual Invitational`, opp: otherSchools[1], date: '2026-12-12', time: '9:00 AM', home: false },
    { name: `Tiger-Grizz Wrestling Invitational`, opp: EXTERNAL_RIVALS[5], date: '2027-01-15', time: '10:00 AM', home: false },
    { name: `${school.name} Senior Night Wrestling Dual vs ${otherSchools[2].name}`, opp: otherSchools[2], date: '2027-01-28', time: '6:30 PM', home: true },
    { name: `District VI Wrestling Championship`, opp: otherSchools[3], date: '2027-02-12', time: '9:00 AM', home: false }
  ];
  wrestlingEvents.forEach((wr, i) => {
    events.push({
      id: `${school.id}-wr-${String(evtIndex++).padStart(3, '0')}`,
      schoolId: school.id,
      sport: 'Wrestling',
      gender: 'Coed',
      level: 'Varsity',
      eventName: wr.name,
      eventType: wr.name.includes('Invitational') || wr.name.includes('Championship') ? 'Tournament' : 'Game',
      opponent: wr.opp.name,
      opponentMascot: wr.opp.mascot,
      locationType: wr.home ? 'Home' : 'Away',
      date: wr.date,
      time: wr.time,
      startTime: wr.time,
      endTime: '8:30 PM',
      venueName: wr.home ? school.gymName : `${wr.opp.name} Gymnasium`,
      venueAddress: wr.home ? school.venueAddress : (wr.opp.venueAddress || wr.opp.addr),
      lat: wr.home ? school.lat : (wr.opp.lat || school.lat),
      lng: wr.home ? school.lng : (wr.opp.lng || school.lng),
      homeScore: null,
      awayScore: null,
      ourScore: null,
      oppScore: null,
      status: 'Scheduled',
      highlights: `High-intensity wrestling dual featuring state-ranked wrestlers across all weight classes.`,
      description: `Wrestling competition. Weigh-ins begin 1 hour prior to start time.`,
      parkingInfo: 'Main gym parking available.',
      ticketUrl: school.ticketUrl
    });
  });

  // 9. BASEBALL & SOFTBALL (Spring Season: Mar - May)
  const springOpponents = [otherSchools[0], otherSchools[1], otherSchools[2], EXTERNAL_RIVALS[0]];
  springOpponents.forEach((opp, i) => {
    const isHome = i % 2 === 0;
    const bbDate = `2027-04-${String(10 + i * 6).padStart(2, '0')}`;
    const sbDate = `2027-04-${String(12 + i * 6).padStart(2, '0')}`;

    // Baseball
    events.push({
      id: `${school.id}-bsb-${String(evtIndex++).padStart(3, '0')}`,
      schoolId: school.id,
      sport: 'Baseball',
      gender: 'Boys',
      level: 'Varsity',
      eventName: `${school.name} Varsity Baseball ${isHome ? 'vs' : 'at'} ${opp.name}`,
      eventType: 'Game',
      opponent: opp.name,
      opponentMascot: opp.mascot,
      locationType: isHome ? 'Home' : 'Away',
      date: bbDate,
      time: '4:00 PM',
      startTime: '4:00 PM',
      endTime: '6:30 PM',
      venueName: isHome ? school.baseballName : `${opp.name} Diamond`,
      venueAddress: isHome ? school.venueAddress : (opp.venueAddress || opp.addr),
      lat: isHome ? school.lat : (opp.lat || school.lat),
      lng: isHome ? school.lng : (opp.lng || school.lng),
      homeScore: null,
      awayScore: null,
      ourScore: null,
      oppScore: null,
      status: 'Scheduled',
      highlights: `Spring varsity baseball action on the diamond.`,
      description: `7-inning varsity baseball game between ${school.name} and ${opp.name}.`,
      parkingInfo: 'Baseball diamond parking.',
      ticketUrl: school.ticketUrl
    });

    // Softball
    events.push({
      id: `${school.id}-sfb-${String(evtIndex++).padStart(3, '0')}`,
      schoolId: school.id,
      sport: 'Softball',
      gender: 'Girls',
      level: 'Varsity',
      eventName: `${school.name} Varsity Softball ${isHome ? 'vs' : 'at'} ${opp.name}`,
      eventType: 'Game',
      opponent: opp.name,
      opponentMascot: opp.mascot,
      locationType: isHome ? 'Home' : 'Away',
      date: sbDate,
      time: '4:00 PM',
      startTime: '4:00 PM',
      endTime: '6:15 PM',
      venueName: isHome ? `${school.name} Softball Field` : `${opp.name} Softball Field`,
      venueAddress: isHome ? school.venueAddress : (opp.venueAddress || opp.addr),
      lat: isHome ? school.lat : (opp.lat || school.lat),
      lng: isHome ? school.lng : (opp.lng || school.lng),
      homeScore: null,
      awayScore: null,
      ourScore: null,
      oppScore: null,
      status: 'Scheduled',
      highlights: `Fastpitch softball conference contest featuring top pitchers and sluggers.`,
      description: `Girls varsity softball matchup. Bleacher seating available.`,
      parkingInfo: 'Softball field parking.',
      ticketUrl: school.ticketUrl
    });
  });

  // 10. TRACK & FIELD (Spring Season: April - May)
  const trackMeets = [
    { name: `${school.mascot} Track & Field Invitational`, date: '2027-04-17', time: '10:00 AM', home: true },
    { name: `Trojan Relays & Track Classic`, date: '2027-05-01', time: '9:00 AM', home: false, opp: otherSchools[4] || otherSchools[0] },
    { name: `District VI Track & Field Championships`, date: '2027-05-14', time: '10:00 AM', home: false, opp: otherSchools[1] }
  ];
  trackMeets.forEach((trk, i) => {
    events.push({
      id: `${school.id}-trk-${String(evtIndex++).padStart(3, '0')}`,
      schoolId: school.id,
      sport: 'Track',
      gender: 'Coed',
      level: 'Varsity',
      eventName: trk.name,
      eventType: 'Tournament',
      opponent: 'District Invitational',
      opponentMascot: 'Various',
      locationType: trk.home ? 'Home' : 'Away',
      date: trk.date,
      time: trk.time,
      startTime: trk.time,
      endTime: '4:00 PM',
      venueName: trk.home ? school.venueName : (trk.opp ? `${trk.opp.name} Stadium` : 'Regional Track Stadium'),
      venueAddress: trk.home ? school.venueAddress : (trk.opp ? trk.opp.venueAddress : school.venueAddress),
      lat: trk.home ? school.lat : (trk.opp ? trk.opp.lat : school.lat),
      lng: trk.home ? school.lng : (trk.opp ? trk.opp.lng : school.lng),
      homeScore: null,
      awayScore: null,
      ourScore: null,
      oppScore: null,
      status: 'Scheduled',
      highlights: `Sprints, distance, hurdles, relays, jumps, and throws under the spring sky.`,
      description: `High school track & field meet. All events timed electronically. Concessions open all day.`,
      parkingInfo: 'Stadium parking lot.',
      ticketUrl: school.ticketUrl
    });
  });

  // 11. TENNIS (Spring: April - May)
  const tennisMatches = [
    { name: `${school.name} Tennis vs ${otherSchools[0].name}`, opp: otherSchools[0], date: '2027-04-20', home: true },
    { name: `${school.name} Tennis vs ${otherSchools[1].name}`, opp: otherSchools[1], date: '2027-04-27', home: false }
  ];
  tennisMatches.forEach((ten, i) => {
    events.push({
      id: `${school.id}-ten-${String(evtIndex++).padStart(3, '0')}`,
      schoolId: school.id,
      sport: 'Tennis',
      gender: 'Coed',
      level: 'Varsity',
      eventName: ten.name,
      eventType: 'Game',
      opponent: ten.opp.name,
      opponentMascot: ten.opp.mascot,
      locationType: ten.home ? 'Home' : 'Away',
      date: ten.date,
      time: '3:30 PM',
      startTime: '3:30 PM',
      endTime: '6:30 PM',
      venueName: ten.home ? `${school.name} Tennis Courts` : `${ten.opp.name} Tennis Courts`,
      venueAddress: ten.home ? school.venueAddress : (ten.opp.venueAddress || ten.opp.addr),
      lat: ten.home ? school.lat : (ten.opp.lat || school.lat),
      lng: ten.home ? school.lng : (ten.opp.lng || school.lng),
      homeScore: null,
      awayScore: null,
      ourScore: null,
      oppScore: null,
      status: 'Scheduled',
      highlights: `Singles and doubles tennis conference matches.`,
      description: `Boys and girls varsity tennis competition. Free admission.`,
      parkingInfo: 'Tennis court parking area.',
      ticketUrl: ''
    });
  });

  // 12. SCHOOL ACTIVITIES, ARTS, CLUBS & COMMUNITY EVENTS
  const schoolSpecificActivities = [
    {
      name: `${school.mascot} Homecoming Parade, Tailgate & Pep Rally`,
      club: 'Student Council',
      type: 'Assembly',
      date: '2026-10-02',
      time: '2:30 PM',
      loc: `${school.name} Main Stadium`,
      desc: `Annual Homecoming parade through town followed by the high-energy school pep rally, coronation, and community tailgate.`,
      past: true
    },
    {
      name: `Fall Drama Production: ${school.id === 'madison' ? 'Newsies The Musical' : (school.id === 'rigby' ? 'Twelve Angry Jurors' : 'The Crucible')}`,
      club: 'Drama & Theater',
      type: 'School Event',
      date: '2026-10-22',
      time: '7:00 PM',
      loc: school.auditoriumName,
      desc: `Outstanding theater performance featuring our talented high school drama students. Reserve seats online.`,
      past: false
    },
    {
      name: `${school.mascot} Robotics Team Regional FTC Scrimmage`,
      club: 'Robotics Club',
      type: 'Club Meeting',
      date: '2026-10-24',
      time: '9:00 AM',
      loc: `${school.name} STEM Workshop & Commons`,
      desc: `Hands-on robotics competition featuring autonomous and driver-controlled rover challenges against neighboring regional teams.`,
      past: false
    },
    {
      name: `Fall Band & Choir Extravaganza`,
      club: 'Music Department',
      type: 'School Event',
      date: '2026-11-05',
      time: '7:00 PM',
      loc: school.auditoriumName,
      desc: `Concert band, jazz ensemble, chamber choir, and treble choir presenting an evening of acoustic and symphonic classics.`,
      past: false
    },
    {
      name: `District VI Forensics, Speech & Debate Invitational`,
      club: 'Debate & Speech',
      type: 'Tournament',
      date: '2026-11-14',
      time: '8:00 AM',
      loc: `${school.name} Academic Wing`,
      desc: `Interscholastic policy debate, Lincoln-Douglas, impromptu speech, and humorous interpretation competitions.`,
      past: false
    },
    {
      name: `Winter Holiday Gala Concert & Tree Lighting`,
      club: 'Music & Arts',
      type: 'School Event',
      date: '2026-12-10',
      time: '7:00 PM',
      loc: school.auditoriumName,
      desc: `Celebrate the holidays with festive music, hot cocoa, orchestra performances, and our annual campus tree lighting ceremony.`,
      past: false
    },
    {
      name: `FFA Community Harvest Auction & Tri-Tip Dinner`,
      club: 'FFA (Future Farmers)',
      type: 'School Event',
      date: '2027-01-23',
      time: '5:30 PM',
      loc: `${school.name} Commons & Cafeteria`,
      desc: `Annual FFA community fundraising dinner and silent auction supporting agriculture students and leadership conferences.`,
      past: false
    },
    {
      name: `National Honor Society Induction Ceremony`,
      club: 'National Honor Society',
      type: 'Assembly',
      date: '2027-02-18',
      time: '6:30 PM',
      loc: school.auditoriumName,
      desc: `Formal induction of newly selected sophomore, junior, and senior scholars into the National Honor Society chapter.`,
      past: false
    },
    {
      name: `Spring Musical: ${school.id === 'rigby' ? 'Mamma Mia!' : (school.id === 'madison' ? 'Fiddler on the Roof' : 'Beauty and the Beast')}`,
      club: 'Drama & Theater',
      type: 'School Event',
      date: '2027-03-18',
      time: '7:00 PM',
      loc: school.auditoriumName,
      desc: `Full-scale musical theatre production accompanied by live pit orchestra. Concessions benefit theater scholarships.`,
      past: false
    },
    {
      name: `Junior-Senior Prom: "A Night Under the Stars"`,
      club: 'Student Council',
      type: 'School Event',
      date: '2027-04-24',
      time: '8:00 PM',
      loc: `${school.name} Grand Ballroom & Commons`,
      desc: `Annual formal evening for upperclassmen featuring professional DJ, photography stations, and dessert bar.`,
      past: false
    },
    {
      name: `Senior Showcase, Awards Banquet & Scholarship Night`,
      club: 'Student Council',
      type: 'Assembly',
      date: '2027-05-19',
      time: '6:30 PM',
      loc: school.auditoriumName,
      desc: `Celebrating the Class of 2027 with departmental academic awards, athletic letters, and community scholarship presentations.`,
      past: false
    },
    {
      name: `${school.name} Class of 2027 Commencement Ceremony`,
      club: 'School Administration',
      type: 'Assembly',
      date: '2027-05-28',
      time: '7:00 PM',
      loc: school.venueName,
      desc: `Graduation commencement ceremony honoring the graduating senior class. Family, friends, and alumni welcome.`,
      past: false
    }
  ];

  schoolSpecificActivities.forEach(act => {
    events.push({
      id: `${school.id}-act-${String(evtIndex++).padStart(3, '0')}`,
      schoolId: school.id,
      sport: 'Other',
      club: act.club,
      eventName: act.name,
      eventType: act.type,
      opponent: '',
      opponentMascot: '',
      locationType: 'Home',
      date: act.date,
      time: act.time,
      startTime: act.time,
      endTime: '9:30 PM',
      venueName: act.loc,
      venueAddress: school.venueAddress,
      lat: school.lat,
      lng: school.lng,
      homeScore: null,
      awayScore: null,
      ourScore: null,
      oppScore: null,
      status: act.past ? 'Completed' : 'Scheduled',
      highlights: `${act.club} signature event bringing together the ${school.mascot} community.`,
      description: act.desc,
      parkingInfo: 'Campus main parking lot and student overflow spaces available.',
      ticketUrl: school.ticketUrl
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
  console.log('=== GameDay+ Multi-School Firestore Comprehensive Seeder ===\n');
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
    console.log(`  Generated ${schoolEvents.length} comprehensive games, tournaments, and school activities.`);
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
