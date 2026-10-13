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

  function normalizeEvent(id, data = {}) {
    const homeScore = data.homeScore ?? data.ourScore ?? null;
    const awayScore = data.awayScore ?? data.oppScore ?? null;
    const sport = data.sport || '';
    const opponent = data.opponent || '';
    const locationType = data.locationType || data.homeAway || 'Home';
    const venueName = data.venueName || data.location || (locationType === 'Home' ? 'Sugar-Salem High School' : (opponent ? `${opponent} High School` : ''));
    const venueAddress = data.venueAddress || data.address || (locationType === 'Home' ? '#1 Digger Dr, Sugar City, ID 83448' : '');
    const time = data.startTime || data.time || 'TBA';
    const eventName = data.eventName || data.name || (opponent ? `${sport ? sport + ' ' : ''}${data.level || 'Varsity'} vs ${opponent}` : (sport ? `${sport} Event` : 'Event'));
    const status = data.status || (homeScore !== null && awayScore !== null ? 'Final' : 'Scheduled');

    return {
      id: String(id),
      sport,
      club: data.club || '',
      eventName,
      eventType: data.eventType || 'Game',
      gender: data.gender || 'Boys',
      level: data.level || 'Varsity',
      opponent,
      opponentMascot: data.opponentMascot || '',
      locationType,
      homeAway: locationType,
      date: data.date || '',
      time,
      startTime: time,
      endTime: data.endTime || '',
      venueName,
      location: venueName,
      venueAddress,
      address: venueAddress,
      lat: typeof data.lat === 'number' ? data.lat : (data.lat ? Number(data.lat) : 43.8744),
      lng: typeof data.lng === 'number' ? data.lng : (data.lng ? Number(data.lng) : -111.7483),
      parkingInfo: data.parkingInfo || 'Standard spectator parking available.',
      ticketUrl: data.ticketUrl || 'https://sugarsalemhighschool.arbiterwebsites.com/',
      description: data.description || '',
      ourScore: homeScore,
      oppScore: awayScore,
      homeScore,
      awayScore,
      status,
      highlights: data.highlights || '',
      stats: data.stats || null,
      schoolId: data.schoolId || schoolId
    };
  }

  async function loadEvents() {
    if (!configured) return { events: await loadLocalEvents(), isLiveFirestore: false };
    try {
      let snapshot;
      try {
        snapshot = await collection('events').orderBy('date').get();
      } catch (orderErr) {
        console.warn('orderBy("date") query failed, falling back to standard get():', orderErr);
        snapshot = await collection('events').get();
      }
      if (snapshot && !snapshot.empty) {
        const events = snapshot.docs.map(doc => normalizeEvent(doc.id, doc.data()));
        events.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
        return { events, isLiveFirestore: true };
      }
    } catch (error) {
      console.warn('Firestore loadEvents failed, falling back to local events:', error);
    }
    // If Firestore collection is empty or query failed, return local events so events always show!
    const localEvents = await loadLocalEvents();
    return { events: localEvents, isLiveFirestore: false, isEmptyFirestore: true };
  }

  async function loadLocalEvents() {
    try {
      const response = await fetch('./data/events.json');
      if (!response.ok) throw new Error(`Unable to load local events (${response.status})`);
      const data = await response.json();
      const list = (Array.isArray(data) ? data : data.events || []).filter(event => !event.schoolId || event.schoolId === schoolId);
      return list.map(item => normalizeEvent(item.id, item));
    } catch (err) {
      console.warn('loadLocalEvents fallback error:', err);
      return [];
    }
  }

  function onEventsSnapshot(callback) {
    if (!configured) return () => {};
    try {
      return collection('events').onSnapshot(
        snapshot => {
          if (!snapshot || snapshot.empty) return;
          const events = snapshot.docs.map(doc => normalizeEvent(doc.id, doc.data()));
          events.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
          callback(events);
        },
        err => console.warn('Real-time events subscription error:', err)
      );
    } catch (_) {
      return () => {};
    }
  }

  async function saveEvent(id, eventData) {
    if (!configured) throw new Error('Firebase is not configured.');
    const docRef = id ? collection('events').doc(id) : collection('events').doc();
    const docId = docRef.id;
    const normalized = normalizeEvent(docId, { ...eventData, schoolId });
    await docRef.set({
      ...normalized,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    return normalized;
  }

  async function deleteEvent(id) {
    if (!configured) throw new Error('Firebase is not configured.');
    if (!id) return;
    await collection('events').doc(id).delete();
  }

  async function seedEventsToFirestore(eventsList) {
    if (!configured) throw new Error('Firebase is not configured.');
    const items = eventsList && eventsList.length ? eventsList : await loadLocalEvents();
    if (!items.length) throw new Error('No events found to upload.');

    const batchLimit = 400;
    let batch = db.batch();
    let currentBatchSize = 0;
    let totalSaved = 0;

    for (const item of items) {
      const docId = String(item.id || `evt-${Date.now()}-${totalSaved}`);
      const ref = collection('events').doc(docId);
      const data = normalizeEvent(docId, item);
      batch.set(ref, {
        ...data,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      currentBatchSize++;
      totalSaved++;

      if (currentBatchSize >= batchLimit) {
        await batch.commit();
        batch = db.batch();
        currentBatchSize = 0;
      }
    }

    if (currentBatchSize > 0) {
      await batch.commit();
    }

    return totalSaved;
  }

  function isConfigured() { return configured; }
  function auth() { return firebase.auth(); }
  function signInWithEmail(email, password) {
    return firebase.auth().signInWithEmailAndPassword(email, password);
  }
  function createAccount(email, password) {
    return firebase.auth().createUserWithEmailAndPassword(email, password);
  }
  function signInWithGoogle() {
    return firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider());
  }
  function signOut() { return firebase.auth().signOut(); }
  function onAuthStateChanged(callback) { return firebase.auth().onAuthStateChanged(callback); }

  async function isAdminUser(user) {
    const current = user || (firebase && firebase.auth ? firebase.auth().currentUser : null);
    if (!current) return false;
    try {
      const tokenResult = await current.getIdTokenResult(true);
      const claims = tokenResult.claims || {};
      if (claims.admin === true || claims.role === 'admin') return true;
      const email = (current.email || '').toLowerCase();
      if (email.includes('admin') || email.endsWith('@sugarsalem.com')) return true;
      return false;
    } catch (error) {
      return false;
    }
  }

  function events() { return collection('events'); }
  function resources(name) { return collection(name); }
  function settings() { return db.collection('schools').doc(schoolId).collection('settings').doc('school'); }

  async function loadSettings() {
    if (!configured) return {};
    try {
      const snapshot = await settings().get();
      return snapshot.exists ? snapshot.data() : {};
    } catch (_) {
      return {};
    }
  }

  return {
    schoolId,
    isConfigured,
    auth,
    signInWithEmail,
    createAccount,
    signInWithGoogle,
    signOut,
    onAuthStateChanged,
    isAdminUser,
    events,
    resources,
    settings,
    loadEvents,
    loadLocalEvents,
    onEventsSnapshot,
    saveEvent,
    deleteEvent,
    seedEventsToFirestore,
    loadSettings,
    normalizeEvent
  };
})();

window.GameDayFirebase = GameDayFirebase;