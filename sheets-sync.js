/**
 * GameDay+ - Google Sheets Sync & Data Engine
 * Handles fetching, parsing, caching, and default fallbacks for school athletic events.
 */

const SheetsSync = (function() {
  const STORAGE_KEY_SHEET_URL = 'gameday_sheet_url';
  const STORAGE_KEY_CUSTOM_DATA = 'gameday_cached_events';

  // Realistic sample high school athletic dataset with upcoming, live, and past games
  // All coordinates and venues provide real map routing experience
  const DEFAULT_EVENTS = [
    {
      id: 'gm-fb-01',
      sport: 'Football',
      gender: 'Boys',
      level: 'Varsity',
      opponent: 'Oakridge Eagles',
      opponentMascot: 'Eagles',
      locationType: 'Away',
      date: getRelativeDate(2), // 2 days in future
      time: '7:00 PM',
      venueName: 'Oakridge Community Stadium',
      venueAddress: '450 Valley Rd, Westfield',
      lat: 40.73061,
      lng: -74.17500,
      parkingInfo: 'North Lot ($5 cash/card), Gates open at 5:30 PM',
      ticketUrl: '#',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Rivalry match for the District Championship.',
      stats: null
    },
    {
      id: 'gm-bb-01',
      sport: 'Basketball',
      gender: 'Girls',
      level: 'Varsity',
      opponent: 'Pinecrest Panthers',
      opponentMascot: 'Panthers',
      locationType: 'Home',
      date: getRelativeDate(0), // Today
      time: '6:30 PM',
      venueName: 'Westfield High Main Gymnasium',
      venueAddress: '1000 High School Way, Westfield',
      lat: 40.71278,
      lng: -74.00594,
      parkingInfo: 'Main campus west parking lot - Free admission for students with ID',
      ticketUrl: '#',
      ourScore: 48,
      oppScore: 42,
      status: 'Live',
      highlights: 'Q4 3:12 remaining - High intensity conference battle!',
      stats: {
        periods: [
          { name: 'Q1', us: 12, them: 10 },
          { name: 'Q2', us: 14, them: 13 },
          { name: 'Q3', us: 10, them: 11 },
          { name: 'Q4', us: 12, them: 8 }
        ],
        playerOfTheGame: {
          name: 'Maya Rodriguez (#24)',
          stat: '19 PTS, 7 REB, 4 AST',
          avatar: 'MR'
        },
        teamStats: {
          fgPct: '46%',
          threePtPct: '38%',
          rebounds: 34,
          steals: 8
        }
      }
    },
    {
      id: 'gm-sc-01',
      sport: 'Soccer',
      gender: 'Boys',
      level: 'Varsity',
      opponent: 'Summit Hill Rangers',
      opponentMascot: 'Rangers',
      locationType: 'Away',
      date: getRelativeDate(4), // 4 days in future
      time: '4:15 PM',
      venueName: 'Summit Hill Turf Complex',
      venueAddress: '880 Summit Ave, Westfield',
      lat: 40.75889,
      lng: -73.98513,
      parkingInfo: 'Lower lot behind the tennis courts. Bleacher seating available.',
      ticketUrl: '#',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Regional playoff seeding match.',
      stats: null
    },
    {
      id: 'gm-vb-01',
      sport: 'Volleyball',
      gender: 'Girls',
      level: 'Varsity',
      opponent: 'Highland Park Scots',
      opponentMascot: 'Scots',
      locationType: 'Home',
      date: getRelativeDate(5),
      time: '5:30 PM',
      venueName: 'Westfield High Aux Gym',
      venueAddress: '1000 High School Way, Westfield',
      lat: 40.71278,
      lng: -74.00594,
      parkingInfo: 'East parking lot near athletic entrance.',
      ticketUrl: '#',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Theme Night: Neon Spirit Night!',
      stats: null
    },
    {
      id: 'gm-bs-01',
      sport: 'Baseball',
      gender: 'Boys',
      level: 'Varsity',
      opponent: 'Riverdale Warriors',
      opponentMascot: 'Warriors',
      locationType: 'Away',
      date: getRelativeDate(-3), // 3 days ago (Past)
      time: '4:00 PM',
      venueName: 'Riverdale Memorial Park Field 1',
      venueAddress: '220 River Rd, Westfield',
      lat: 40.72816,
      lng: -74.07764,
      parkingInfo: 'Street parking along Memorial Park Dr.',
      ticketUrl: '#',
      ourScore: 7,
      oppScore: 3,
      status: 'Final',
      highlights: 'Complete game 8-strikeout performance on the mound by Tyler Vance.',
      stats: {
        periods: [
          { name: '1-3', us: 3, them: 0 },
          { name: '4-6', us: 2, them: 2 },
          { name: '7-9', us: 2, them: 1 }
        ],
        playerOfTheGame: {
          name: 'Tyler Vance (#11)',
          stat: '7.0 IP, 8 K, 2 ER & 2-for-3 with 3 RBI',
          avatar: 'TV'
        },
        teamStats: {
          hits: 11,
          errors: 0,
          strikeouts: 8,
          leftOnBase: 5
        }
      }
    },
    {
      id: 'gm-fb-02',
      sport: 'Football',
      gender: 'Boys',
      level: 'Varsity',
      opponent: 'Lakewood Tigers',
      opponentMascot: 'Tigers',
      locationType: 'Home',
      date: getRelativeDate(-7), // 7 days ago (Past)
      time: '7:00 PM',
      venueName: 'Westfield Alumni Stadium',
      venueAddress: '1000 High School Way, Westfield',
      lat: 40.71278,
      lng: -74.00594,
      parkingInfo: 'All campus lots open. Tailgate area opens at 4:30 PM.',
      ticketUrl: '#',
      ourScore: 35,
      oppScore: 14,
      status: 'Final',
      highlights: 'Homecoming Game! Dominant ground game with 240 rushing yards.',
      stats: {
        periods: [
          { name: 'Q1', us: 7, them: 0 },
          { name: 'Q2', us: 14, them: 7 },
          { name: 'Q3', us: 7, them: 7 },
          { name: 'Q4', us: 7, them: 0 }
        ],
        playerOfTheGame: {
          name: 'Jaylen Brooks (#5)',
          stat: '165 Rushing YDS, 3 TD',
          avatar: 'JB'
        },
        teamStats: {
          totalYards: 385,
          passingYards: 145,
          rushingYards: 240,
          turnovers: 0
        }
      }
    },
    {
      id: 'gm-tr-01',
      sport: 'Track & Field',
      gender: 'Co-ed',
      level: 'Varsity & JV',
      opponent: 'Tri-County Invitational',
      opponentMascot: 'Invitational',
      locationType: 'Away',
      date: getRelativeDate(8),
      time: '9:00 AM',
      venueName: 'Metro Athletics Complex',
      venueAddress: '500 Stadium Blvd, Metro City',
      lat: 40.78286,
      lng: -73.96535,
      parkingInfo: 'South Deck B ($10). Spectator entrance through Gate 4.',
      ticketUrl: '#',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: '16 high schools competing across 24 track and field events.',
      stats: null
    },
    {
      id: 'gm-cl-01',
      sport: 'Cheer & Clubs',
      gender: 'Co-ed',
      level: 'Varsity',
      opponent: 'State Cheer & Spirit Showcase',
      opponentMascot: 'State Spirit',
      locationType: 'Away',
      date: getRelativeDate(12),
      time: '1:00 PM',
      venueName: 'Centennial Convention Arena',
      venueAddress: '1200 Arena Way, Capital City',
      lat: 40.74844,
      lng: -73.98566,
      parkingInfo: 'Attached parking garage with direct skybridge access.',
      ticketUrl: '#',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Varsity Cheer squad performing the routine for Nationals bid.',
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
      // Regex handling of comma within quotes
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
        venueName: 'Stadium',
        venueAddress: '100 Main St',
        lat: 40.71278,
        lng: -74.00594,
        parkingInfo: 'Standard spectator parking available.',
        ticketUrl: '#',
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
        else if (header.includes('lat')) item.lat = parseFloat(val) || 40.71278;
        else if (header.includes('lng') || header.includes('lon')) item.lng = parseFloat(val) || -74.00594;
      });

      // Auto deduce status if not provided
      if (!item.status || item.status === 'Upcoming') {
        if (item.ourScore !== null && item.oppScore !== null) {
          item.status = 'Final';
        }
      }

      results.push(item);
    }

    return results;
  }

  // Load events from LocalStorage cache, custom sheet, or default realistic dataset
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
        console.warn('Could not fetch live Google Sheet, using cached or default data.', err);
      }
    }

    // Try cached data
    const cached = localStorage.getItem(STORAGE_KEY_CUSTOM_DATA);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return { events: parsed, isLiveSheet: Boolean(savedUrl) };
        }
      } catch (e) {
        // Fall through
      }
    }

    return { events: DEFAULT_EVENTS, isLiveSheet: false };
  }

  // Save new Sheet URL and fetch
  async function syncCustomSheetUrl(url) {
    if (!url || !url.trim()) {
      localStorage.removeItem(STORAGE_KEY_SHEET_URL);
      localStorage.removeItem(STORAGE_KEY_CUSTOM_DATA);
      return { success: true, count: DEFAULT_EVENTS.length, events: DEFAULT_EVENTS, isLive: false };
    }

    let cleanUrl = url.trim();
    // If user provided a standard Google Sheets URL, convert it to CSV export
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
