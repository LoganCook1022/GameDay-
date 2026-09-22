const GameDayFirebase = (() => {
  const config = window.GAMEDAY_FIREBASE_CONFIG || {};
  const configured = Boolean(config.apiKey && config.projectId && window.firebase);
  const schoolId = new URLSearchParams(window.location.search).get('school') || 'sugar-salem';
  let db;

  if (configured && !firebase.apps.length) firebase.initializeApp(config);
  if (configured) db = firebase.firestore();

  function collection(name) {
    return db.collection('schools').doc(schoolId).collection(name);
  }

  function normalizeEvent(id, data) {
    return {
      id,
      sport: data.sport || '',
      club: data.club || '',
      eventName: data.eventName || data.name || '',
      eventType: data.eventType || 'Game',
      gender: data.gender || '',
      level: data.level || '',
      opponent: data.opponent || '',
      opponentMascot: data.opponentMascot || '',
      locationType: data.locationType || data.homeAway || 'Home',
      date: data.date || '',
      time: data.startTime || data.time || 'TBA',
      endTime: data.endTime || '',
      venueName: data.location || data.venueName || '',
      venueAddress: data.address || data.venueAddress || '',
      description: data.description || '',
      ourScore: data.homeScore ?? data.ourScore ?? null,
      oppScore: data.awayScore ?? data.oppScore ?? null,
      status: data.status || 'Scheduled',
      highlights: data.highlights || '',
      stats: data.stats || null,
      schoolId
    };
  }

  async function loadEvents() {
    if (!configured) return { events: await loadLocalEvents(), isLiveFirestore: false };
    const snapshot = await collection('events').orderBy('date').get();
    return { events: snapshot.docs.map(doc => normalizeEvent(doc.id, doc.data())), isLiveFirestore: true };
  }

  async function loadLocalEvents() {
    const response = await fetch('./data/events.json');
    if (!response.ok) throw new Error(`Unable to load local events (${response.status})`);
    const data = await response.json();
    return (Array.isArray(data) ? data : data.events || []).filter(event => !event.schoolId || event.schoolId === schoolId);
  }

  function isConfigured() { return configured; }
  function auth() { return firebase.auth(); }
  function events() { return collection('events'); }
  function resources(name) { return collection(name); }
  function settings() { return db.collection('schools').doc(schoolId).collection('settings').doc('school'); }

  async function loadSettings() {
    if (!configured) return {};
    const snapshot = await settings().get();
    return snapshot.exists ? snapshot.data() : {};
  }

  return { schoolId, isConfigured, auth, events, resources, settings, loadEvents, loadSettings, normalizeEvent };
})();

window.GameDayFirebase = GameDayFirebase;