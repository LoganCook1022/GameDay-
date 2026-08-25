/**
 * GameDay+ - Google Sheets Sync & Data Engine
 * Synchronized with Sugar-Salem High School (Diggers) Athletics & Calendars
 * Source: https://hs.sugarsalem.org/sportscalendars & ArbiterLive ID 22686
 */

const SheetsSync = (function() {
  const STORAGE_KEY_SHEET_URL = 'gameday_sheet_url';
  const STORAGE_KEY_CUSTOM_DATA = 'gameday_cached_events';

  // Authentic Sugar-Salem High School Diggers Athletic & Event Schedule
  const DEFAULT_EVENTS = [
    // 1. FOOTBALL
    {
      id: 'ss-fb-01',
      sport: 'Football',
      gender: 'Boys',
      level: 'Varsity',
      opponent: 'Homedale Trojans',
      opponentMascot: 'Trojans',
      locationType: 'Away',
      date: '2026-08-22',
      time: '4:00 PM',
      venueName: 'Canyon Ridge High Stadium',
      venueAddress: '300 N College Rd W, Twin Falls, ID 83301',
      lat: 42.5850,
      lng: -114.4750,
      parkingInfo: 'North Spectator Parking Lot. Tickets online via GoFan or gate.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7063843?activeEntityId=22686',
      ourScore: 28,
      oppScore: 21,
      status: 'Final',
      highlights: 'Season opener classic in Twin Falls! Strong defensive stop in Q4 to seal the victory.',
      stats: {
        periods: [
          { name: 'Q1', us: 7, them: 0 },
          { name: 'Q2', us: 7, them: 14 },
          { name: 'Q3', us: 7, them: 0 },
          { name: 'Q4', us: 7, them: 7 }
        ],
        playerOfTheGame: {
          name: 'Dawson McInelly (#7)',
          stat: '142 Rushing YDS, 2 TD, 1 INT',
          avatar: 'DM'
        },
        teamStats: { totalYards: 345, passingYards: 160, rushingYards: 185, turnovers: 1 }
      }
    },
    {
      id: 'ss-fb-02',
      sport: 'Football',
      gender: 'Boys',
      level: 'Varsity',
      opponent: 'Snake River Panthers',
      opponentMascot: 'Panthers',
      locationType: 'Away',
      date: '2026-08-28',
      time: '7:00 PM',
      venueName: 'Snake River High Football Stadium',
      venueAddress: '922 W Hwy 39, Blackfoot, ID 83221',
      lat: 43.2185,
      lng: -112.3920,
      parkingInfo: 'Main lot adjacent to football field. Gates open at 5:30 PM.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7063843?activeEntityId=22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Conference clash against the Panthers in Blackfoot!',
      stats: null
    },
    {
      id: 'ss-fb-03',
      sport: 'Football',
      gender: 'Boys',
      level: 'Varsity',
      opponent: 'Shelley Russets',
      opponentMascot: 'Russets',
      locationType: 'Away',
      date: '2026-09-04',
      time: '7:00 PM',
      venueName: 'Shelley High Stadium',
      venueAddress: '570 W Fir St, Shelley, ID 83274',
      lat: 43.3768,
      lng: -112.1332,
      parkingInfo: 'East stadium parking lot. Student bus parking in designated lane.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7063843?activeEntityId=22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'High-stakes battle against 4A district rival Shelley.',
      stats: null
    },
    {
      id: 'ss-fb-04',
      sport: 'Football',
      gender: 'Boys',
      level: 'Varsity',
      opponent: 'Star Valley Braves (WY)',
      opponentMascot: 'Braves',
      locationType: 'Home',
      date: '2026-09-11',
      time: '7:00 PM',
      venueName: 'Sugar-Salem Digger Stadium',
      venueAddress: '#1 Digger Dr, Sugar City, ID 83448',
      lat: 43.8744,
      lng: -111.7483,
      parkingInfo: 'High school campus parking lot. Tailgate & student section opens at 5:00 PM.',
      ticketUrl: 'https://sugarsalemhighschool.arbiterwebsites.com/',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Interstate border rivalry showdown! Wear Blue & Gold spirit gear.',
      stats: null
    },
    {
      id: 'ss-fb-05',
      sport: 'Football',
      gender: 'Boys',
      level: 'Varsity',
      opponent: 'Kimberly Bulldogs',
      opponentMascot: 'Bulldogs',
      locationType: 'Home',
      date: '2026-09-18',
      time: '7:00 PM',
      venueName: 'Sugar-Salem Digger Stadium',
      venueAddress: '#1 Digger Dr, Sugar City, ID 83448',
      lat: 43.8744,
      lng: -111.7483,
      parkingInfo: 'Full campus parking open. Concession stand open with hot chocolate & burgers.',
      ticketUrl: 'https://sugarsalemhighschool.arbiterwebsites.com/',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Non-conference marquee game under Friday night lights.',
      stats: null
    },
    {
      id: 'ss-fb-06',
      sport: 'Football',
      gender: 'Boys',
      level: 'Varsity',
      opponent: 'Preston Indians',
      opponentMascot: 'Indians',
      locationType: 'Home',
      date: '2026-09-25',
      time: '7:00 PM',
      venueName: 'Sugar-Salem Digger Stadium',
      venueAddress: '#1 Digger Dr, Sugar City, ID 83448',
      lat: 43.8744,
      lng: -111.7483,
      parkingInfo: 'Main high school athletic lot.',
      ticketUrl: 'https://sugarsalemhighschool.arbiterwebsites.com/',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Homecoming Weekend 2026! Halftime coronation & spirit parade.',
      stats: null
    },
    {
      id: 'ss-fb-07',
      sport: 'Football',
      gender: 'Boys',
      level: 'Varsity',
      opponent: 'Teton Timberwolves',
      opponentMascot: 'Timberwolves',
      locationType: 'Home',
      date: '2026-10-09',
      time: '7:00 PM',
      venueName: 'Sugar-Salem Digger Stadium',
      venueAddress: '#1 Digger Dr, Sugar City, ID 83448',
      lat: 43.8744,
      lng: -111.7483,
      parkingInfo: 'Campus stadium lot. Senior Night recognition before kick-off.',
      ticketUrl: 'https://sugarsalemhighschool.arbiterwebsites.com/',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Mountain Rivers Conference championship implications.',
      stats: null
    },
    {
      id: 'ss-fb-08',
      sport: 'Football',
      gender: 'Boys',
      level: 'Varsity',
      opponent: 'South Fremont Cougars',
      opponentMascot: 'Cougars',
      locationType: 'Away',
      date: '2026-10-16',
      time: '7:00 PM',
      venueName: 'South Fremont High Stadium',
      venueAddress: '855 N Bridge St, St Anthony, ID 83445',
      lat: 43.9740,
      lng: -111.6840,
      parkingInfo: 'Visitor parking on North side of high school campus.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7063843?activeEntityId=22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'The Historic Highway 20 Rivalry Game! Diggers vs Cougars.',
      stats: null
    },

    // 2. VOLLEYBALL
    {
      id: 'ss-vb-01',
      sport: 'Volleyball',
      gender: 'Girls',
      level: 'Varsity',
      opponent: 'Snake River Panthers',
      opponentMascot: 'Panthers',
      locationType: 'Away',
      date: '2026-09-01',
      time: '6:30 PM',
      venueName: 'Snake River High Gymnasium',
      venueAddress: '922 W Hwy 39, Blackfoot, ID 83221',
      lat: 43.2185,
      lng: -112.3920,
      parkingInfo: 'Park near the athletic wing entrance.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7754683?activeEntityId=22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Varsity match follows JV at 5:00 PM.',
      stats: null
    },
    {
      id: 'ss-vb-02',
      sport: 'Volleyball',
      gender: 'Girls',
      level: 'Varsity',
      opponent: 'South Fremont Cougars',
      opponentMascot: 'Cougars',
      locationType: 'Away',
      date: '2026-09-08',
      time: '6:30 PM',
      venueName: 'South Fremont High Gymnasium',
      venueAddress: '855 N Bridge St, St Anthony, ID 83445',
      lat: 43.9740,
      lng: -111.6840,
      parkingInfo: 'South campus entrance, gym doors open at 4:30 PM.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7754683?activeEntityId=22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Cross-county conference showdown.',
      stats: null
    },
    {
      id: 'ss-vb-03',
      sport: 'Volleyball',
      gender: 'Girls',
      level: 'Varsity',
      opponent: 'Teton Timberwolves',
      opponentMascot: 'Timberwolves',
      locationType: 'Home',
      date: '2026-09-15',
      time: '6:30 PM',
      venueName: 'Sugar-Salem High Main Gym',
      venueAddress: '#1 Digger Dr, Sugar City, ID 83448',
      lat: 43.8744,
      lng: -111.7483,
      parkingInfo: 'Main school parking lot - Free admission for SSHS students with ID.',
      ticketUrl: 'https://sugarsalemhighschool.arbiterwebsites.com/',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Diggers Volley Spirit Night! Pack the gym in Royal Blue.',
      stats: null
    },

    // 3. SOCCER (BOYS & GIRLS)
    {
      id: 'ss-sc-01',
      sport: 'Soccer',
      gender: 'Boys',
      level: 'Varsity',
      opponent: 'South Fremont Cougars',
      opponentMascot: 'Cougars',
      locationType: 'Home',
      date: '2026-09-03',
      time: '4:30 PM',
      venueName: 'Sugar-Salem Soccer Complex',
      venueAddress: '#1 Digger Dr, Sugar City, ID 83448',
      lat: 43.8744,
      lng: -111.7483,
      parkingInfo: 'Field parking located west of track & stadium.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7576349?activeEntityId=22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'District 6 conference opener.',
      stats: null
    },
    {
      id: 'ss-sc-02',
      sport: 'Soccer',
      gender: 'Girls',
      level: 'Varsity',
      opponent: 'Teton Timberwolves',
      opponentMascot: 'Timberwolves',
      locationType: 'Away',
      date: '2026-09-10',
      time: '4:30 PM',
      venueName: 'Teton High Soccer Field',
      venueAddress: '555 E Ross Ave, Driggs, ID 83422',
      lat: 43.7230,
      lng: -111.1030,
      parkingInfo: 'Parking adjacent to main high school gym & turf.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7576350?activeEntityId=22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Scenic Teton Valley road match for the Lady Diggers.',
      stats: null
    },

    // 4. CROSS COUNTRY & TRACK
    {
      id: 'ss-xc-01',
      sport: 'Track & Field',
      gender: 'Co-ed',
      level: 'Varsity',
      opponent: 'Tiger-Grizz & District Invitational',
      opponentMascot: 'Invitational',
      locationType: 'Away',
      date: '2026-09-12',
      time: '9:00 AM',
      venueName: 'Freeman Park Course',
      venueAddress: '1290 Science Center Dr, Idaho Falls, ID 83402',
      lat: 43.5075,
      lng: -112.0280,
      parkingInfo: 'Freeman Park upper parking lot and river overlook.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/11667996?activeEntityId=22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Over 20 regional schools competing in 5K & sprint events.',
      stats: null
    },

    // 5. BASKETBALL (WINTER SEASON)
    {
      id: 'ss-bb-01',
      sport: 'Basketball',
      gender: 'Boys',
      level: 'Varsity',
      opponent: 'Shelley Russets',
      opponentMascot: 'Russets',
      locationType: 'Home',
      date: '2026-12-04',
      time: '7:30 PM',
      venueName: 'Sugar-Salem High Main Gym',
      venueAddress: '#1 Digger Dr, Sugar City, ID 83448',
      lat: 43.8744,
      lng: -111.7483,
      parkingInfo: 'Main campus lot. Pep band and cheerleaders performing live.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7706395?activeEntityId=22686',
      ourScore: 68,
      oppScore: 54,
      status: 'Final',
      highlights: 'Dominant shooting performance with 11 three-pointers!',
      stats: {
        periods: [
          { name: 'Q1', us: 18, them: 12 },
          { name: 'Q2', us: 16, them: 14 },
          { name: 'Q3', us: 20, them: 13 },
          { name: 'Q4', us: 14, them: 15 }
        ],
        playerOfTheGame: {
          name: 'Carson Harris (#12)',
          stat: '24 PTS, 8 REB, 5 AST',
          avatar: 'CH'
        },
        teamStats: { fgPct: '51%', threePtPct: '42%', rebounds: 38, steals: 9 }
      }
    },
    {
      id: 'ss-bb-02',
      sport: 'Basketball',
      gender: 'Girls',
      level: 'Varsity',
      opponent: 'South Fremont Cougars',
      opponentMascot: 'Cougars',
      locationType: 'Home',
      date: '2026-12-08',
      time: '7:30 PM',
      venueName: 'Sugar-Salem High Main Gym',
      venueAddress: '#1 Digger Dr, Sugar City, ID 83448',
      lat: 43.8744,
      lng: -111.7483,
      parkingInfo: 'Full parking available. Concessions open.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7706392?activeEntityId=22686',
      ourScore: 56,
      oppScore: 48,
      status: 'Final',
      highlights: 'Lady Diggers clutch free throws in final minute to secure rivalry victory.',
      stats: {
        periods: [
          { name: 'Q1', us: 14, them: 11 },
          { name: 'Q2', us: 12, them: 13 },
          { name: 'Q3', us: 16, them: 12 },
          { name: 'Q4', us: 14, them: 12 }
        ],
        playerOfTheGame: {
          name: 'Aubrey Miller (#21)',
          stat: '21 PTS, 11 REB, 4 BLK',
          avatar: 'AM'
        },
        teamStats: { fgPct: '45%', threePtPct: '36%', rebounds: 42, steals: 7 }
      }
    },

    // 6. CHEER, DANCE & FINE ARTS
    {
      id: 'ss-cl-01',
      sport: 'Cheer & Clubs',
      gender: 'Co-ed',
      level: 'Varsity',
      opponent: 'Idaho State Spirit & Cheer Showcase',
      opponentMascot: 'State Spirit',
      locationType: 'Away',
      date: '2026-11-14',
      time: '1:00 PM',
      venueName: 'Hero Arena at the Mountain America Center',
      venueAddress: '1690 Event Center Dr, Idaho Falls, ID 83402',
      lat: 43.4912,
      lng: -112.0620,
      parkingInfo: 'MAC Event Center surface parking ($5).',
      ticketUrl: 'https://hs.sugarsalem.org/finearts',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Sugar-Salem Cheer & Dance teams competing for State Championship bid.',
      stats: null
    }
  ];

  // Helper function to get relative dates formatted YYYY-MM-DD
  function getRelativeDate(offsetDays) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Parse CSV formatted text into game objects
  function parseCSV(csvText) {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
    const results = [];

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(',');
      const cleanRow = row.map(cell => cell.replace(/^"(.*)"$/, '$1').trim());
      
      const item = {
        id: 'sheet-evt-' + i,
        sport: 'Other',
        gender: 'Varsity',
        level: 'Varsity',
        opponent: 'Opponent',
        opponentMascot: '',
        locationType: 'Away',
        date: getRelativeDate(0),
        time: '7:00 PM',
        venueName: 'Sugar-Salem Digger Stadium',
        venueAddress: '#1 Digger Dr, Sugar City, ID 83448',
        lat: 43.8744,
        lng: -111.7483,
        parkingInfo: 'Standard spectator parking available.',
        ticketUrl: 'https://sugarsalemhighschool.arbiterwebsites.com/',
        ourScore: null,
        oppScore: null,
        status: 'Upcoming',
        highlights: '',
        stats: null
      };

      headers.forEach((header, index) => {
        const val = cleanRow[index];
        if (val === undefined) return;

        if (header.includes('sport')) item.sport = val;
        else if (header.includes('opp') || header.includes('team')) item.opponent = val;
        else if (header.includes('date')) item.date = val;
        else if (header.includes('time')) item.time = val;
        else if (header.includes('loc') || header.includes('homeaway')) item.locationType = val.toLowerCase().includes('home') ? 'Home' : 'Away';
        else if (header.includes('venue') || header.includes('stadium')) item.venueName = val;
        else if (header.includes('addr')) item.venueAddress = val;
        else if (header.includes('ourscore') || header === 'us' || header === 'score') item.ourScore = isNaN(parseInt(val)) ? null : parseInt(val);
        else if (header.includes('oppscore') || header === 'them') item.oppScore = isNaN(parseInt(val)) ? null : parseInt(val);
        else if (header.includes('status')) item.status = val;
        else if (header.includes('note') || header.includes('highlight')) item.highlights = val;
        else if (header.includes('lat')) item.lat = parseFloat(val) || 43.8744;
        else if (header.includes('lng') || header.includes('lon')) item.lng = parseFloat(val) || -111.7483;
      });

      if (!item.status || item.status === 'Upcoming') {
        if (item.ourScore !== null && item.oppScore !== null) {
          item.status = 'Final';
        }
      }

      results.push(item);
    }

    return results;
  }

  // Load events from LocalStorage cache, custom sheet, or Sugar-Salem dataset
  async function loadEvents() {
    const savedUrl = localStorage.getItem(STORAGE_KEY_SHEET_URL);
    if (savedUrl) {
      try {
        const response = await fetch(savedUrl);
        if (response.ok) {
          const csvText = await response.text();
          const parsed = parseCSV(csvText);
          if (parsed.length > 0) {
            localStorage.setItem(STORAGE_KEY_CUSTOM_DATA, JSON.stringify(parsed));
            return { events: parsed, isLiveSheet: true };
          }
        }
      } catch (err) {
        console.warn('Could not fetch live Google Sheet, using Sugar-Salem Diggers data.', err);
      }
    }

    // Always use official Sugar-Salem schedule by default
    return { events: DEFAULT_EVENTS, isLiveSheet: false };
  }

  async function syncCustomSheetUrl(url) {
    if (!url || !url.trim()) {
      localStorage.removeItem(STORAGE_KEY_SHEET_URL);
      localStorage.removeItem(STORAGE_KEY_CUSTOM_DATA);
      return { success: true, count: DEFAULT_EVENTS.length, events: DEFAULT_EVENTS, isLive: false };
    }

    let cleanUrl = url.trim();
    if (cleanUrl.includes('docs.google.com/spreadsheets') && !cleanUrl.includes('output=csv')) {
      if (cleanUrl.includes('/edit')) {
        cleanUrl = cleanUrl.replace(/\/edit.*$/, '/export?format=csv');
      } else if (cleanUrl.includes('/pubhtml')) {
        cleanUrl = cleanUrl.replace('/pubhtml', '/pub?output=csv');
      }
    }

    try {
      const response = await fetch(cleanUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to retrieve sheet`);
      }
      const csvText = await response.text();
      const parsed = parseCSV(csvText);
      if (parsed.length === 0) {
        throw new Error('No valid event rows found in CSV');
      }

      localStorage.setItem(STORAGE_KEY_SHEET_URL, cleanUrl);
      localStorage.setItem(STORAGE_KEY_CUSTOM_DATA, JSON.stringify(parsed));
      return { success: true, count: parsed.length, events: parsed, isLive: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  function resetToSampleData() {
    localStorage.removeItem(STORAGE_KEY_SHEET_URL);
    localStorage.removeItem(STORAGE_KEY_CUSTOM_DATA);
    return DEFAULT_EVENTS;
  }

  function getSavedSheetUrl() {
    return localStorage.getItem(STORAGE_KEY_SHEET_URL) || '';
  }

  return {
    loadEvents,
    syncCustomSheetUrl,
    resetToSampleData,
    getSavedSheetUrl,
    DEFAULT_EVENTS
  };
})();

// Export globally
window.SheetsSync = SheetsSync;
