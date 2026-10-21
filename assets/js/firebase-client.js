const GameDayFirebase = (() => {
  const config = window.GAMEDAY_FIREBASE_CONFIG || {};
  const configured = Boolean(config.apiKey && config.projectId && window.firebase);
  const schoolId = new URLSearchParams(window.location.search).get('school') || 'sugar-salem';
  let db;

  const SCHOOL_META = {
    'sugar-salem': {
      name: 'Sugar-Salem High School',
      mascot: 'Diggers',
      venueName: 'Sugar-Salem High School Stadium',
      venueAddress: '#1 Digger Dr, Sugar City, ID 83448',
      lat: 43.8744,
      lng: -111.7483,
      ticketUrl: 'https://sugarsalemhighschool.arbiterwebsites.com/'
    },
    'south-fremont': {
      name: 'South Fremont High School',
      mascot: 'Cougars',
      venueName: 'South Fremont High School Stadium',
      venueAddress: '850 N Bridge St, St Anthony, ID 83445',
      lat: 43.9749,
      lng: -111.6847,
      ticketUrl: 'https://gofan.co/'
    },
    'teton': {
      name: 'Teton High School',
      mascot: 'Timberwolves',
      venueName: 'Teton High School Stadium',
      venueAddress: '555 E Ross Ave, Driggs, ID 83422',
      lat: 43.7225,
      lng: -111.1033,
      ticketUrl: 'https://gofan.co/'
    },
    'snake-river': {
      name: 'Snake River High School',
      mascot: 'Panthers',
      venueName: 'Snake River High School Stadium',
      venueAddress: '922 S 700 W, Blackfoot, ID 83221',
      lat: 43.1672,
      lng: -112.4045,
      ticketUrl: 'https://gofan.co/'
    },
    'madison': {
      name: 'Madison High School',
      mascot: 'Bobcats',
      venueName: 'Madison High School Stadium',
      venueAddress: '2300 University Blvd, Rexburg, ID 83440',
      lat: 43.8055,
      lng: -111.7981,
      ticketUrl: 'https://gofan.co/'
    },
    'rigby': {
      name: 'Rigby High School',
      mascot: 'Trojans',
      venueName: 'Rigby High School Trojan Stadium',
      venueAddress: '3850 E 300 N, Rigby, ID 83442',
      lat: 43.6811,
      lng: -111.8953,
      ticketUrl: 'https://gofan.co/'
    }
  };

  if (configured && !firebase.apps.length) firebase.initializeApp(config);
  if (configured) db = firebase.firestore();

  function collection(name) {
    return db.collection('schools').doc(schoolId).collection(name);
  }

  function normalizeEvent(id, data = {}) {
    const targetSchoolId = data.schoolId || schoolId;
    const meta = SCHOOL_META[targetSchoolId] || SCHOOL_META['sugar-salem'];
    const homeScore = data.homeScore ?? data.ourScore ?? null;
    const awayScore = data.awayScore ?? data.oppScore ?? null;
    const sport = data.sport || '';
    const opponent = data.opponent || '';
    const locationType = data.locationType || data.homeAway || 'Home';
    const venueName = data.venueName || data.location || (locationType === 'Home' ? meta.venueName : (opponent ? `${opponent} High School` : ''));
    const venueAddress = data.venueAddress || data.address || (locationType === 'Home' ? meta.venueAddress : '');
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
      lat: typeof data.lat === 'number' ? data.lat : (data.lat ? Number(data.lat) : meta.lat),
      lng: typeof data.lng === 'number' ? data.lng : (data.lng ? Number(data.lng) : meta.lng),
      parkingInfo: data.parkingInfo || 'Standard spectator parking available.',
      ticketUrl: data.ticketUrl || meta.ticketUrl,
      description: data.description || '',
      ourScore: homeScore,
      oppScore: awayScore,
      homeScore,
      awayScore,
      status,
      highlights: data.highlights || '',
      stats: data.stats || null,
      schoolId: targetSchoolId
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

    const email = (current.email || '').toLowerCase().trim();
    // 1. Logan Cook is the super administrator
    if (email === 'cook.logan@sugarsalem.com') {
      return true;
    }

    // 2. Custom claims
    try {
      const tokenResult = await current.getIdTokenResult(true);
      const claims = tokenResult.claims || {};
      if (claims.admin === true) return true;
    } catch (_) {}

    // 3. Firestore admins collection
    if (configured && db && email) {
      try {
        const doc = await db.collection('admins').doc(email).get();
        if (doc.exists && doc.data() && doc.data().approved === true) {
          return true;
        }
      } catch (err) {
        console.warn('Firestore admin check warning:', err);
      }
    }

    // 4. Local storage approved cache
    try {
      const approvedList = JSON.parse(localStorage.getItem('gameday_approved_admins') || '[]');
      if (approvedList.includes(email)) return true;
    } catch (_) {}

    return false;
  }

  async function approveAdminUser(emailToApprove, schoolToAssign = schoolId) {
    const cleanEmail = (emailToApprove || '').toLowerCase().trim();
    if (!cleanEmail) throw new Error('Valid email address is required.');

    // 1. Local cache update
    try {
      const approvedList = JSON.parse(localStorage.getItem('gameday_approved_admins') || '[]');
      if (!approvedList.includes(cleanEmail)) {
        approvedList.push(cleanEmail);
        localStorage.setItem('gameday_approved_admins', JSON.stringify(approvedList));
      }
    } catch (_) {}

    // 2. Firestore admins collection
    if (configured && db) {
      try {
        await db.collection('admins').doc(cleanEmail).set({
          email: cleanEmail,
          approved: true,
          approvedBy: 'cook.logan@sugarsalem.com',
          approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
          role: 'admin',
          schoolId: schoolToAssign
        }, { merge: true });

        // Update admin_requests doc if exists
        try {
          await db.collection('admin_requests').doc(cleanEmail).set({
            status: 'approved',
            resolvedAt: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        } catch (_) {}
      } catch (err) {
        console.warn('Could not write to Firestore admins collection:', err);
      }
    }

    return { success: true, email: cleanEmail, schoolId: schoolToAssign };
  }

  async function recordAdminRequest(emailToRequest, schoolToAssign = schoolId, note = '') {
    const cleanEmail = (emailToRequest || '').toLowerCase().trim();
    if (!cleanEmail) return;

    if (configured && db) {
      try {
        await db.collection('admin_requests').doc(cleanEmail).set({
          email: cleanEmail,
          schoolId: schoolToAssign,
          note: note || 'Requested via GameDay+ Admin portal',
          status: 'pending',
          requestedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      } catch (err) {
        console.warn('Could not write to Firestore admin_requests collection:', err);
      }
    }
  }

  async function getApprovedAdmins() {
    const results = [];
    if (configured && db) {
      try {
        const snap = await db.collection('admins').get();
        snap.forEach(d => results.push({ id: d.id, ...d.data() }));
      } catch (_) {}
    }
    return results;
  }

  async function getAdminRequests() {
    const results = [];
    if (configured && db) {
      try {
        const snap = await db.collection('admin_requests').get();
        snap.forEach(d => results.push({ id: d.id, ...d.data() }));
      } catch (_) {}
    }
    return results;
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

  // Seed super admin email into Firestore if not already present
  const SUPER_ADMIN_EMAIL = 'cook.logan@sugarsalem.com';
  const SUPER_ADMIN_PASSWORD = 'GameDaySuperAdmin!';
  if (configured) {
    // Ensure admin entry in Firestore
    approveAdminUser(SUPER_ADMIN_EMAIL).catch(() => {});
    // Ensure Firebase Auth account exists with known password
    signInWithEmail(SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD).catch(() => {
      // If sign-in fails (likely user not found), create the account
      createAccount(SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD).catch(() => {});
    });
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
    approveAdminUser,
    recordAdminRequest,
    getApprovedAdmins,
    getAdminRequests,
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