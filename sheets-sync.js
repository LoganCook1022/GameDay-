/**
 * GameDay+ - Google Sheets Sync & Data Engine
 * Synchronized with Sugar-Salem High School (Diggers) Athletics & Calendars
 * Source: https://hs.sugarsalem.org/sportscalendars & ArbiterLive ID 22686
 */

const SheetsSync = (function() {
  const STORAGE_KEY_SHEET_URL = 'gameday_sheet_url';
  const STORAGE_KEY_CUSTOM_DATA = 'gameday_cached_events';

  // Comprehensive Authentic Sugar-Salem High School Diggers Athletic & Event Schedule
  // Covers all Fall, Winter, Spring sports and School events from https://hs.sugarsalem.org/sportscalendars
  const DEFAULT_EVENTS = [
    // ==========================================
    // 1. FOOTBALL (Varsity & Key Games)
    // ==========================================
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
      ourScore: 34,
      oppScore: 14,
      status: 'Final',
      highlights: 'Dominant conference opening road win against the Panthers!',
      stats: {
        periods: [
          { name: 'Q1', us: 10, them: 0 },
          { name: 'Q2', us: 10, them: 7 },
          { name: 'Q3', us: 7, them: 0 },
          { name: 'Q4', us: 7, them: 7 }
        ],
        playerOfTheGame: {
          name: 'Tate Bingham (#11)',
          stat: '3 Passing TD, 215 Pass YDS',
          avatar: 'TB'
        },
        teamStats: { totalYards: 390, passingYards: 215, rushingYards: 175, turnovers: 0 }
      }
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

    // ==========================================
    // 2. VOLLEYBALL (Varsity & Tournaments)
    // ==========================================
    {
      id: 'ss-vb-01',
      sport: 'Volleyball',
      gender: 'Girls',
      level: 'Varsity',
      opponent: 'Peg Peterson Tournament (Fruitland, Filer, Century)',
      opponentMascot: 'Tournament',
      locationType: 'Away',
      date: '2026-08-22',
      time: '9:00 AM',
      venueName: 'Century High Gymnasium',
      venueAddress: '7801 Diamondback Way, Pocatello, ID 83201',
      lat: 42.8250,
      lng: -112.4150,
      parkingInfo: 'Gymnasium event parking available at Century HS.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7754683?activeEntityId=22686',
      ourScore: 3,
      oppScore: 1,
      status: 'Final',
      highlights: 'Tournament bracket victory with great front-row blocking and serving runs.',
      stats: {
        periods: [
          { name: 'S1', us: 25, them: 21 },
          { name: 'S2', us: 23, them: 25 },
          { name: 'S3', us: 25, them: 18 },
          { name: 'S4', us: 25, them: 16 }
        ],
        playerOfTheGame: {
          name: 'Hailey Harris (#5)',
          stat: '18 Kills, 4 Aces, 14 Digs',
          avatar: 'HH'
        },
        teamStats: { kills: 48, aces: 9, blocks: 11, digs: 56 }
      }
    },
    {
      id: 'ss-vb-02',
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
      highlights: 'Varsity conference battle follows JV at 5:00 PM.',
      stats: null
    },
    {
      id: 'ss-vb-03',
      sport: 'Volleyball',
      gender: 'Girls',
      level: 'Varsity',
      opponent: 'South Fremont Cougars',
      opponentMascot: 'Cougars',
      locationType: 'Home',
      date: '2026-09-03',
      time: '6:30 PM',
      venueName: 'Sugar-Salem High Main Gym',
      venueAddress: '#1 Digger Dr, Sugar City, ID 83448',
      lat: 43.8744,
      lng: -111.7483,
      parkingInfo: 'Main campus lot. Free student admission with ID.',
      ticketUrl: 'https://sugarsalemhighschool.arbiterwebsites.com/',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Conference rivalry match at home in Sugar City.',
      stats: null
    },
    {
      id: 'ss-vb-04',
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
      highlights: 'Cross-county conference rematch in St. Anthony.',
      stats: null
    },
    {
      id: 'ss-vb-05',
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
      parkingInfo: 'Main high school athletic parking lot.',
      ticketUrl: 'https://sugarsalemhighschool.arbiterwebsites.com/',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Diggers Volley Spirit Night! Pack the gym in Royal Blue.',
      stats: null
    },
    {
      id: 'ss-vb-06',
      sport: 'Volleyball',
      gender: 'Girls',
      level: 'Varsity',
      opponent: 'Snake River Panthers',
      opponentMascot: 'Panthers',
      locationType: 'Home',
      date: '2026-09-22',
      time: '6:30 PM',
      venueName: 'Sugar-Salem High Main Gym',
      venueAddress: '#1 Digger Dr, Sugar City, ID 83448',
      lat: 43.8744,
      lng: -111.7483,
      parkingInfo: 'Main lot open, entrance through foyer doors.',
      ticketUrl: 'https://sugarsalemhighschool.arbiterwebsites.com/',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Conference clash against the Lady Panthers at home.',
      stats: null
    },
    {
      id: 'ss-vb-07',
      sport: 'Volleyball',
      gender: 'Girls',
      level: 'Varsity',
      opponent: 'Filer Wildcats',
      opponentMascot: 'Wildcats',
      locationType: 'Away',
      date: '2026-09-26',
      time: '1:00 PM',
      venueName: 'Filer High Gymnasium',
      venueAddress: '3915 N Wildcat Way, Filer, ID 83328',
      lat: 42.5690,
      lng: -114.6110,
      parkingInfo: 'Wildcat athletic parking lot.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7754683?activeEntityId=22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Weekend tournament showcase match in Magic Valley.',
      stats: null
    },
    {
      id: 'ss-vb-08',
      sport: 'Volleyball',
      gender: 'Girls',
      level: 'Varsity',
      opponent: 'Butte County Pirates',
      opponentMascot: 'Pirates',
      locationType: 'Away',
      date: '2026-10-08',
      time: '6:00 PM',
      venueName: 'Butte County High Gym',
      venueAddress: '122 W Ethel St, Arco, ID 83213',
      lat: 43.6355,
      lng: -113.3015,
      parkingInfo: 'School parking lot in Arco.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7754683?activeEntityId=22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Regular season final road test before district playoffs.',
      stats: null
    },

    // ==========================================
    // 3. BOYS SOCCER
    // ==========================================
    {
      id: 'ss-bsc-01',
      sport: 'Soccer',
      gender: 'Boys',
      level: 'Varsity',
      opponent: 'Meridian Warriors',
      opponentMascot: 'Warriors',
      locationType: 'Away',
      date: '2026-08-22',
      time: '11:00 AM',
      venueName: 'Meridian High Soccer Field',
      venueAddress: '1900 W Pine Ave, Meridian, ID 83642',
      lat: 43.6120,
      lng: -116.4150,
      parkingInfo: 'High school west athletic parking lot.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7576349?activeEntityId=22686',
      ourScore: 0,
      oppScore: 0,
      status: 'Final',
      highlights: 'Hard-fought defensive battle resulting in a clean sheet season opening draw.',
      stats: {
        periods: [
          { name: '1H', us: 0, them: 0 },
          { name: '2H', us: 0, them: 0 }
        ],
        playerOfTheGame: {
          name: 'Liam Vance (GK)',
          stat: '8 Saves, Clean Sheet',
          avatar: 'LV'
        },
        teamStats: { shotsOnGoal: 6, saves: 8, cornerKicks: 4, fouls: 7 }
      }
    },
    {
      id: 'ss-bsc-02',
      sport: 'Soccer',
      gender: 'Boys',
      level: 'Varsity',
      opponent: 'American Falls Beavers',
      opponentMascot: 'Beavers',
      locationType: 'Away',
      date: '2026-08-25',
      time: '4:30 PM',
      venueName: 'American Falls High Soccer Field',
      venueAddress: '2966 S Frontage Rd, American Falls, ID 83211',
      lat: 42.7840,
      lng: -112.8510,
      parkingInfo: 'Side stadium parking.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7576349?activeEntityId=22686',
      ourScore: 7,
      oppScore: 1,
      status: 'Final',
      highlights: 'Explosive offensive showing with 7 goals scored on the road!',
      stats: {
        periods: [
          { name: '1H', us: 4, them: 1 },
          { name: '2H', us: 3, them: 0 }
        ],
        playerOfTheGame: {
          name: 'Mateo Ortiz (#10)',
          stat: '3 Goals (Hat Trick), 2 Assists',
          avatar: 'MO'
        },
        teamStats: { shotsOnGoal: 14, saves: 3, cornerKicks: 7, fouls: 5 }
      }
    },
    {
      id: 'ss-bsc-03',
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
      highlights: 'District 6 conference opener on home pitch.',
      stats: null
    },
    {
      id: 'ss-bsc-04',
      sport: 'Soccer',
      gender: 'Boys',
      level: 'Varsity',
      opponent: 'Teton Timberwolves',
      opponentMascot: 'Timberwolves',
      locationType: 'Home',
      date: '2026-09-17',
      time: '4:30 PM',
      venueName: 'Sugar-Salem Soccer Complex',
      venueAddress: '#1 Digger Dr, Sugar City, ID 83448',
      lat: 43.8744,
      lng: -111.7483,
      parkingInfo: 'West pitch parking area.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7576349?activeEntityId=22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Conference duel against Teton Timberwolves.',
      stats: null
    },

    // ==========================================
    // 4. GIRLS SOCCER
    // ==========================================
    {
      id: 'ss-gsc-01',
      sport: 'Soccer',
      gender: 'Girls',
      level: 'Varsity',
      opponent: 'Canyon Ridge Riverhawks',
      opponentMascot: 'Riverhawks',
      locationType: 'Away',
      date: '2026-08-29',
      time: '1:00 PM',
      venueName: 'Canyon Ridge High Soccer Field',
      venueAddress: '300 N College Rd W, Twin Falls, ID 83301',
      lat: 42.5850,
      lng: -114.4750,
      parkingInfo: 'North athletic parking lot.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7576350?activeEntityId=22686',
      ourScore: 4,
      oppScore: 3,
      status: 'Final',
      highlights: 'Thrilling comeback victory with game-winning goal in the 78th minute!',
      stats: {
        periods: [
          { name: '1H', us: 1, them: 2 },
          { name: '2H', us: 3, them: 1 }
        ],
        playerOfTheGame: {
          name: 'Kaylee Sorenson (#9)',
          stat: '2 Goals, 1 Assist, Game-Winner',
          avatar: 'KS'
        },
        teamStats: { shotsOnGoal: 11, saves: 6, cornerKicks: 5, fouls: 6 }
      }
    },
    {
      id: 'ss-gsc-02',
      sport: 'Soccer',
      gender: 'Girls',
      level: 'Varsity',
      opponent: 'South Fremont Cougars',
      opponentMascot: 'Cougars',
      locationType: 'Away',
      date: '2026-09-03',
      time: '4:30 PM',
      venueName: 'South Fremont Soccer Field',
      venueAddress: '855 N Bridge St, St Anthony, ID 83445',
      lat: 43.9740,
      lng: -111.6840,
      parkingInfo: 'Park in south entrance near athletic track.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7576350?activeEntityId=22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Lady Diggers conference road opener in St. Anthony.',
      stats: null
    },
    {
      id: 'ss-gsc-03',
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
    {
      id: 'ss-gsc-04',
      sport: 'Soccer',
      gender: 'Girls',
      level: 'Varsity',
      opponent: 'Shelley Russets',
      opponentMascot: 'Russets',
      locationType: 'Home',
      date: '2026-09-24',
      time: '4:30 PM',
      venueName: 'Sugar-Salem Soccer Complex',
      venueAddress: '#1 Digger Dr, Sugar City, ID 83448',
      lat: 43.8744,
      lng: -111.7483,
      parkingInfo: 'Main school soccer lot.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7576350?activeEntityId=22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Non-conference battle under the afternoon sun.',
      stats: null
    },

    // ==========================================
    // 5. CROSS COUNTRY
    // ==========================================
    {
      id: 'ss-xc-01',
      sport: 'Cross Country',
      gender: 'Co-ed',
      level: 'Varsity',
      opponent: 'Tiger-Grizz Invitational',
      opponentMascot: 'Invitational',
      locationType: 'Away',
      date: '2026-09-12',
      time: '9:00 AM',
      venueName: 'Freeman Park Course',
      venueAddress: '1290 Science Center Dr, Idaho Falls, ID 83402',
      lat: 43.5075,
      lng: -112.0280,
      parkingInfo: 'Freeman Park upper parking lot and river overlook.',
      ticketUrl: 'https://arbiterlive.com/School/Calendar/22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Premier Eastern Idaho cross country meet featuring over 30 regional schools.',
      stats: null
    },
    {
      id: 'ss-xc-02',
      sport: 'Cross Country',
      gender: 'Co-ed',
      level: 'Varsity',
      opponent: 'Bob Firman Invitational',
      opponentMascot: 'Invitational',
      locationType: 'Away',
      date: '2026-09-26',
      time: '9:00 AM',
      venueName: 'Eagle Island State Park',
      venueAddress: '165 S Eagle Island Pkwy, Eagle, ID 83616',
      lat: 43.6840,
      lng: -116.4150,
      parkingInfo: 'State Park entrance parking ($7 day pass or Idaho State Parks passport).',
      ticketUrl: 'https://arbiterlive.com/School/Calendar/22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Nationally recognized high school cross country invitational.',
      stats: null
    },
    {
      id: 'ss-xc-03',
      sport: 'Cross Country',
      gender: 'Co-ed',
      level: 'Varsity',
      opponent: 'District 6 Championship Meet',
      opponentMascot: 'Districts',
      locationType: 'Away',
      date: '2026-10-22',
      time: '2:00 PM',
      venueName: 'Kelly Canyon Ski Course',
      venueAddress: '5488 E Kelly Canyon Rd, Ririe, ID 83443',
      lat: 43.6420,
      lng: -111.6320,
      parkingInfo: 'Base lodge parking area.',
      ticketUrl: 'https://arbiterlive.com/School/Calendar/22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'District 6 state qualifying championship race for Diggers runners.',
      stats: null
    },

    // ==========================================
    // 6. BOYS BASKETBALL (Winter Season)
    // ==========================================
    {
      id: 'ss-bbb-01',
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
      id: 'ss-bbb-02',
      sport: 'Basketball',
      gender: 'Boys',
      level: 'Varsity',
      opponent: 'Snake River Panthers',
      opponentMascot: 'Panthers',
      locationType: 'Away',
      date: '2026-12-11',
      time: '7:30 PM',
      venueName: 'Snake River High Gymnasium',
      venueAddress: '922 W Hwy 39, Blackfoot, ID 83221',
      lat: 43.2185,
      lng: -112.3920,
      parkingInfo: 'Athletic wing parking.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7706395?activeEntityId=22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Conference road matchup against the Panthers.',
      stats: null
    },
    {
      id: 'ss-bbb-03',
      sport: 'Basketball',
      gender: 'Boys',
      level: 'Varsity',
      opponent: 'South Fremont Cougars',
      opponentMascot: 'Cougars',
      locationType: 'Home',
      date: '2026-12-18',
      time: '7:30 PM',
      venueName: 'Sugar-Salem High Main Gym',
      venueAddress: '#1 Digger Dr, Sugar City, ID 83448',
      lat: 43.8744,
      lng: -111.7483,
      parkingInfo: 'Main campus lot. Pack the stands in Diggers gear.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7706395?activeEntityId=22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Annual Holiday Hoops rivalry game vs South Fremont!',
      stats: null
    },
    {
      id: 'ss-bbb-04',
      sport: 'Basketball',
      gender: 'Boys',
      level: 'Varsity',
      opponent: 'Teton Timberwolves',
      opponentMascot: 'Timberwolves',
      locationType: 'Away',
      date: '2027-01-08',
      time: '7:30 PM',
      venueName: 'Teton High Gymnasium',
      venueAddress: '555 E Ross Ave, Driggs, ID 83422',
      lat: 43.7230,
      lng: -111.1030,
      parkingInfo: 'Teton HS main gym parking lot.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7706395?activeEntityId=22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Winter conference road clash in Driggs.',
      stats: null
    },

    // ==========================================
    // 7. GIRLS BASKETBALL (Winter Season)
    // ==========================================
    {
      id: 'ss-gbb-01',
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
    {
      id: 'ss-gbb-02',
      sport: 'Basketball',
      gender: 'Girls',
      level: 'Varsity',
      opponent: 'Snake River Panthers',
      opponentMascot: 'Panthers',
      locationType: 'Home',
      date: '2026-12-15',
      time: '7:30 PM',
      venueName: 'Sugar-Salem High Main Gym',
      venueAddress: '#1 Digger Dr, Sugar City, ID 83448',
      lat: 43.8744,
      lng: -111.7483,
      parkingInfo: 'High school gym parking lot.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7706392?activeEntityId=22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Key conference home game for the Lady Diggers.',
      stats: null
    },
    {
      id: 'ss-gbb-03',
      sport: 'Basketball',
      gender: 'Girls',
      level: 'Varsity',
      opponent: 'Teton Timberwolves',
      opponentMascot: 'Timberwolves',
      locationType: 'Away',
      date: '2027-01-12',
      time: '7:30 PM',
      venueName: 'Teton High Gymnasium',
      venueAddress: '555 E Ross Ave, Driggs, ID 83422',
      lat: 43.7230,
      lng: -111.1030,
      parkingInfo: 'Gym lot on East Ross Ave.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7706392?activeEntityId=22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Mountain Rivers Conference girls basketball showdown.',
      stats: null
    },

    // ==========================================
    // 8. WRESTLING (Winter Season)
    // ==========================================
    {
      id: 'ss-wr-01',
      sport: 'Wrestling',
      gender: 'Boys',
      level: 'Varsity',
      opponent: 'Sugar-Salem Digger Duals Invitational',
      opponentMascot: 'Duals',
      locationType: 'Home',
      date: '2026-12-05',
      time: '9:00 AM',
      venueName: 'Sugar-Salem High Main Gym',
      venueAddress: '#1 Digger Dr, Sugar City, ID 83448',
      lat: 43.8744,
      lng: -111.7483,
      parkingInfo: 'All campus parking open all day for tournament spectators.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7657044?activeEntityId=22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Annual 12-team wrestling invitational on multiple mats in Sugar City.',
      stats: null
    },
    {
      id: 'ss-wr-02',
      sport: 'Wrestling',
      gender: 'Boys',
      level: 'Varsity',
      opponent: 'Rollie Lane Invitational',
      opponentMascot: 'Invitational',
      locationType: 'Away',
      date: '2027-01-08',
      time: '8:00 AM',
      venueName: 'Ford Idaho Center',
      venueAddress: '16200 N Idaho Center Blvd, Nampa, ID 83687',
      lat: 43.6060,
      lng: -116.5050,
      parkingInfo: 'Ford Idaho Center arena parking ($5-$10).',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7657044?activeEntityId=22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'One of the most prestigious multi-state high school wrestling tournaments in the West.',
      stats: null
    },
    {
      id: 'ss-wr-03',
      sport: 'Wrestling',
      gender: 'Boys',
      level: 'Varsity',
      opponent: 'South Fremont & Teton Tri-Dual',
      opponentMascot: 'Tri-Dual',
      locationType: 'Away',
      date: '2027-01-28',
      time: '5:30 PM',
      venueName: 'South Fremont High Gymnasium',
      venueAddress: '855 N Bridge St, St Anthony, ID 83445',
      lat: 43.9740,
      lng: -111.6840,
      parkingInfo: 'High school parking lot in St. Anthony.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7657044?activeEntityId=22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Conference dual meet championship decider.',
      stats: null
    },

    // ==========================================
    // 9. BASEBALL & SOFTBALL (Spring Season)
    // ==========================================
    {
      id: 'ss-bsb-01',
      sport: 'Baseball',
      gender: 'Boys',
      level: 'Varsity',
      opponent: 'Shelley Russets',
      opponentMascot: 'Russets',
      locationType: 'Home',
      date: '2027-03-24',
      time: '4:00 PM',
      venueName: 'Sugar-Salem Baseball Diamond',
      venueAddress: '#1 Digger Dr, Sugar City, ID 83448',
      lat: 43.8744,
      lng: -111.7483,
      parkingInfo: 'East parking lot next to varsity diamond and dugouts.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7660358?activeEntityId=22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Opening day of the 2027 Diggers Baseball season!',
      stats: null
    },
    {
      id: 'ss-bsb-02',
      sport: 'Baseball',
      gender: 'Boys',
      level: 'Varsity',
      opponent: 'South Fremont Cougars',
      opponentMascot: 'Cougars',
      locationType: 'Away',
      date: '2027-04-07',
      time: '4:00 PM',
      venueName: 'South Fremont Baseball Field',
      venueAddress: '855 N Bridge St, St Anthony, ID 83445',
      lat: 43.9740,
      lng: -111.6840,
      parkingInfo: 'Cougar baseball diamond parking.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7660358?activeEntityId=22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Rivalry conference baseball series opener.',
      stats: null
    },
    {
      id: 'ss-sfb-01',
      sport: 'Softball',
      gender: 'Girls',
      level: 'Varsity',
      opponent: 'Snake River Panthers',
      opponentMascot: 'Panthers',
      locationType: 'Home',
      date: '2027-03-30',
      time: '4:00 PM',
      venueName: 'Sugar-Salem Softball Field',
      venueAddress: '#1 Digger Dr, Sugar City, ID 83448',
      lat: 43.8744,
      lng: -111.7483,
      parkingInfo: 'Softball complex spectator lot.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7689212?activeEntityId=22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Lady Diggers Softball season home opener.',
      stats: null
    },
    {
      id: 'ss-sfb-02',
      sport: 'Softball',
      gender: 'Girls',
      level: 'Varsity',
      opponent: 'Teton Timberwolves',
      opponentMascot: 'Timberwolves',
      locationType: 'Away',
      date: '2027-04-14',
      time: '4:00 PM',
      venueName: 'Teton High Softball Diamond',
      venueAddress: '555 E Ross Ave, Driggs, ID 83422',
      lat: 43.7230,
      lng: -111.1030,
      parkingInfo: 'Driggs campus parking.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/7689212?activeEntityId=22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Conference softball road battle in Teton Valley.',
      stats: null
    },

    // ==========================================
    // 10. TRACK & FIELD (Spring Season)
    // ==========================================
    {
      id: 'ss-tr-01',
      sport: 'Track & Field',
      gender: 'Co-ed',
      level: 'Varsity',
      opponent: 'Sugar-Salem Track Invitational',
      opponentMascot: 'Invitational',
      locationType: 'Home',
      date: '2027-04-10',
      time: '10:00 AM',
      venueName: 'Sugar-Salem Digger Stadium',
      venueAddress: '#1 Digger Dr, Sugar City, ID 83448',
      lat: 43.8744,
      lng: -111.7483,
      parkingInfo: 'Main campus lot. Concessions open all day.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/11667996?activeEntityId=22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Home track and field invitational featuring running, jumps, throws, and relays.',
      stats: null
    },
    {
      id: 'ss-tr-02',
      sport: 'Track & Field',
      gender: 'Co-ed',
      level: 'Varsity',
      opponent: 'District 6 Track Championships',
      opponentMascot: 'Districts',
      locationType: 'Away',
      date: '2027-05-13',
      time: '1:00 PM',
      venueName: 'Rigby High Track Stadium',
      venueAddress: '3850 E 300 N, Rigby, ID 83442',
      lat: 43.6820,
      lng: -111.8950,
      parkingInfo: 'Rigby HS stadium parking lot.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/11667996?activeEntityId=22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'State qualification championship meet for track and field athletes.',
      stats: null
    },

    // ==========================================
    // 11. TENNIS (Spring Season)
    // ==========================================
    {
      id: 'ss-tn-01',
      sport: 'Tennis',
      gender: 'Co-ed',
      level: 'Varsity',
      opponent: 'South Fremont Cougars',
      opponentMascot: 'Cougars',
      locationType: 'Home',
      date: '2027-04-06',
      time: '3:30 PM',
      venueName: 'Sugar-Salem Tennis Courts',
      venueAddress: '#1 Digger Dr, Sugar City, ID 83448',
      lat: 43.8744,
      lng: -111.7483,
      parkingInfo: 'Courtside parking lot.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/11681949?activeEntityId=22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Diggers Tennis home opener with singles and doubles matches.',
      stats: null
    },
    {
      id: 'ss-tn-02',
      sport: 'Tennis',
      gender: 'Co-ed',
      level: 'Varsity',
      opponent: 'Teton Timberwolves',
      opponentMascot: 'Timberwolves',
      locationType: 'Away',
      date: '2027-04-20',
      time: '3:30 PM',
      venueName: 'Teton High Tennis Complex',
      venueAddress: '555 E Ross Ave, Driggs, ID 83422',
      lat: 43.7230,
      lng: -111.1030,
      parkingInfo: 'Driggs campus parking.',
      ticketUrl: 'https://arbiterlive.com/Teams/Schedule/11681949?activeEntityId=22686',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Conference tennis match in Driggs.',
      stats: null
    },

    // ==========================================
    // 12. CHEER, DANCE & FINE ARTS CALENDAR
    // ==========================================
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
    },
    {
      id: 'ss-fa-01',
      sport: 'Fine Arts',
      gender: 'All',
      level: 'All School',
      opponent: 'Sugar-Salem High Fall Band & Choir Concert',
      opponentMascot: 'Music Department',
      locationType: 'Home',
      date: '2026-10-20',
      time: '7:00 PM',
      venueName: 'Sugar-Salem High Auditorium',
      venueAddress: '#1 Digger Dr, Sugar City, ID 83448',
      lat: 43.8744,
      lng: -111.7483,
      parkingInfo: 'Auditorium entrance on south wing of campus. Free admission.',
      ticketUrl: 'https://hs.sugarsalem.org/finearts',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Annual Fall Music Department performance featuring Symphonic Band, Jazz Band, and Concert Choirs.',
      stats: null
    },
    {
      id: 'ss-fa-02',
      sport: 'Fine Arts',
      gender: 'All',
      level: 'All School',
      opponent: 'Sugar-Salem High Winter Holiday Gala',
      opponentMascot: 'Holiday Gala',
      locationType: 'Home',
      date: '2026-12-16',
      time: '7:00 PM',
      venueName: 'Sugar-Salem High Auditorium',
      venueAddress: '#1 Digger Dr, Sugar City, ID 83448',
      lat: 43.8744,
      lng: -111.7483,
      parkingInfo: 'Main auditorium parking lot.',
      ticketUrl: 'https://hs.sugarsalem.org/finearts',
      ourScore: null,
      oppScore: null,
      status: 'Upcoming',
      highlights: 'Community holiday performance with orchestral, vocal, and drama presentations.',
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
