const GameDayFirebase = (() => {
  const config = window.GAMEDAY_FIREBASE_CONFIG || {};
  const configured = Boolean(config.apiKey && config.projectId && window.firebase);
  const utils = window.GameDayUtils || {};
  const schema = window.GameDayEventSchema || {};
  const schemaReady = typeof schema.mergeEvent === 'function' && typeof schema.normalizeExternalKey === 'function';
  const requestedSchool = new URLSearchParams(window.location.search).get('school');
  const schoolId = (typeof utils.normalizeSchoolId === 'function'
    ? utils.normalizeSchoolId(requestedSchool, 'sugar-salem')
    : (requestedSchool || 'sugar-salem'));
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

  function collectionFor(targetSchoolId, name) {
    return db.collection('schools').doc(targetSchoolId || schoolId).collection(name);
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
    if (!schemaReady) throw new Error('GameDay+ event schema is not loaded.');

    const docRef = id ? collection('events').doc(id) : collection('events').doc();
    const docId = docRef.id;
    const snapshot = await docRef.get();
    const existing = snapshot.exists ? (snapshot.data() || {}) : null;

    // The admin form is authoritative for the fields it renders, but the stored
    // document is the base for everything the form does not touch (stats,
    // highlights, club, ...).
    const values = eventData || {};
    const mergedInput = { ...(existing || {}), ...values };
    if (values.location !== undefined) mergedInput.venueName = values.location;
    if (values.address !== undefined) mergedInput.venueAddress = values.address;
    if (values.startTime !== undefined) mergedInput.time = values.startTime;

    const normalized = normalizeEvent(docId, mergedInput);
    const hasScore = normalized.ourScore !== null && normalized.ourScore !== undefined;
    const hasStats = normalized.stats !== null && normalized.stats !== undefined;

    const externalKey = (existing && existing.externalKey)
      ? existing.externalKey
      : schema.normalizeExternalKey(null, {
        schoolId,
        source: schema.SOURCE_LOCAL,
        sourceId: docId
      });

    const payload = {
      ...normalized,
      externalKey,
      source: (existing && existing.source) || schema.SOURCE_LOCAL,
      sourceId: (existing && existing.sourceId) || docId,
      schemaVersion: schema.SCHEMA_VERSION,
      manualOverride: true,
      scoresVerified: hasScore ? true : Boolean(existing && existing.scoresVerified),
      statsVerified: hasStats ? true : Boolean(existing && existing.statsVerified)
    };

    const merge = schema.mergeEvent(existing, payload, { source: schema.SOURCE_ADMIN });
    const data = {
      ...schema.stripUndefined(merge.data),
      externalKey,
      source: payload.source,
      sourceId: payload.sourceId,
      schemaVersion: schema.SCHEMA_VERSION,
      manualOverride: payload.manualOverride,
      scoresVerified: payload.scoresVerified,
      statsVerified: payload.statsVerified,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    await docRef.set(data, { merge: true });
    return normalizeEvent(docId, data);
  }

  async function deleteEvent(id) {
    if (!configured) throw new Error('Firebase is not configured.');
    if (!id) return;
    await collection('events').doc(id).delete();
  }

  function buildSeedPayload(item, docId, targetSchoolId) {
    const data = normalizeEvent(docId, { ...item, schoolId: item.schoolId || targetSchoolId });
    const externalKey = schema.normalizeExternalKey(item.externalKey, {
      schoolId: item.schoolId || targetSchoolId,
      source: schema.SOURCE_LOCAL,
      sourceId: item.id || docId
    });

    return {
      ...data,
      externalKey,
      source: schema.SOURCE_LOCAL,
      sourceId: item.id || docId,
      schemaVersion: schema.SCHEMA_VERSION,
      syncOwner: schema.SOURCE_SEED,
      manualOverride: item.manualOverride === true,
      scoresVerified: item.scoresVerified === true,
      statsVerified: item.statsVerified === true
    };
  }

  /**
   * Uploads the local schedule to Firestore without destroying anything that is
   * already there: events are matched by canonical externalKey (or by their
   * existing id for legacy documents), unchanged events are skipped, and
   * admin-owned scores/stats are never overwritten by the seed.
   */
  async function seedEventsToFirestore(eventsList) {
    if (!configured) throw new Error('Firebase is not configured.');
    if (!schemaReady) throw new Error('GameDay+ event schema is not loaded.');
    const items = eventsList && eventsList.length ? eventsList : await loadLocalEvents();
    if (!items.length) throw new Error('No events found to upload.');

    const groups = new Map();
    items.forEach(item => {
      const target = item.schoolId || schoolId;
      if (!groups.has(target)) groups.set(target, []);
      groups.get(target).push(item);
    });

    const batchLimit = 400;
    let batch = db.batch();
    let batchSize = 0;
    let totalSaved = 0;
    let totalUnchanged = 0;
    let totalSkipped = 0;

    for (const [target, group] of groups.entries()) {
      const targetCollection = collectionFor(target, 'events');
      const snapshot = await targetCollection.get();
      const entries = snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() || {} }));
      const byExternalKey = new Map();
      const byId = new Map();
      const byContent = new Map();

      entries.forEach(entry => {
        const data = entry.data;
        if (data.externalKey) byExternalKey.set(data.externalKey, entry);
        byId.set(entry.id, entry);
        if (data.id) byId.set(data.id, entry);
        byContent.set(schema.contentKey(data), entry);
      });

      for (const item of group) {
        const sourceId = item.id ? String(item.id) : `evt-${Date.now()}-${totalSaved}`;
        const docId = item.id
          ? String(item.id)
          : schema.docIdForExternalKey(schema.buildExternalKey(target, schema.SOURCE_LOCAL, sourceId));
        const payload = buildSeedPayload(item, docId, target);
        const existing = byExternalKey.get(payload.externalKey)
          || byId.get(docId)
          || byId.get(sourceId)
          || byContent.get(schema.contentKey(payload))
          || null;

        let writeData = null;
        if (existing) {
          const merge = schema.mergeEvent(existing.data, payload, { source: schema.SOURCE_SEED });
          if (merge.skipped) {
            totalSkipped += 1;
            continue;
          }
          if (!merge.changed) {
            totalUnchanged += 1;
            continue;
          }
          writeData = {
            ...schema.stripUndefined(merge.data),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          };
        } else {
          writeData = {
            ...schema.stripUndefined(payload),
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          };
        }

        batch.set(existing ? existing.ref || collectionFor(target, 'events').doc(existing.id) : targetCollection.doc(docId), writeData, { merge: true });
        batchSize += 1;
        totalSaved += 1;

        if (batchSize >= batchLimit) {
          await batch.commit();
          batch = db.batch();
          batchSize = 0;
        }
      }
    }

    if (batchSize > 0) {
      await batch.commit();
    }

    return { saved: totalSaved, unchanged: totalUnchanged, skipped: totalSkipped };
  }

  function isConfigured() { return configured; }
  function auth() { return firebase.auth(); }
  function signInWithEmail(email, password) {
    return firebase.auth().signInWithEmailAndPassword(email, password);
  }
  // Account creation is intentionally not exposed to the client. Admin accounts are
  // provisioned out-of-band (Firebase console / services/set-claims.js).
  function signInWithGoogle() {
    return firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider());
  }
  function signOut() { return firebase.auth().signOut(); }
  function onAuthStateChanged(callback) { return firebase.auth().onAuthStateChanged(callback); }

  function readClaims(user) {
    if (!user || typeof user.getIdTokenResult !== 'function') return Promise.resolve(null);
    return user.getIdTokenResult(true).then(result => (result && result.claims) || {}).catch(() => null);
  }

  // Authorization sources, in order of authority:
  //   1. server-issued custom claims (admin / schools)
  //   2. the private `admins` roster (accounts approved by a global admin)
  // There is no email allow-list and no client-side cache: either one would let
  // any browser grant itself admin rights. See firestore.rules and services/set-claims.js.
  function isClaimForSchool(claims, schoolIdToCheck) {
    if (!claims) return false;
    if (claims.admin === true) return true;
    const schools = claims.schools;
    if (Array.isArray(schools) && schools.indexOf(schoolIdToCheck) !== -1) return true;
    if (typeof claims.school === 'string' && claims.school === schoolIdToCheck) return true;
    return false;
  }

  // Reads the caller's own roster entry. The rules allow a signed-in account to
  // read only its own document, so this cannot be used to enumerate admins.
  async function readAdminRecord(user) {
    const current = user || (firebase && firebase.auth ? firebase.auth().currentUser : null);
    if (!current || !configured || !db) return null;
    const email = (current.email || '').toLowerCase().trim();
    if (!email) return null;
    try {
      const doc = await db.collection('admins').doc(email).get();
      if (!doc.exists) return null;
      const data = doc.data() || {};
      if (data.approved !== true) return null;
      return { email, role: data.role || 'admin', schoolId: data.schoolId || '' };
    } catch (err) {
      console.warn('Firestore admin record check warning:', err);
      return null;
    }
  }

  // Resolved authorization context for the signed-in account.
  async function getAdminContext(user) {
    const current = user || (firebase && firebase.auth ? firebase.auth().currentUser : null);
    if (!current) {
      return { isAdmin: false, isGlobal: false, role: '', schoolId: '', email: '' };
    }
    const claims = (await readClaims(current)) || {};
    const record = await readAdminRecord(current);
    const isGlobal = claims.admin === true || !!(record && record.role === 'super_admin');
    const isAdmin = isGlobal || !!record || isClaimForSchool(claims, schoolId);
    return {
      isAdmin,
      isGlobal,
      role: record ? record.role : '',
      schoolId: record ? record.schoolId : '',
      email: (current.email || '').toLowerCase().trim(),
      claims
    };
  }

  async function isAdminUser(user) {
    const context = await getAdminContext(user);
    return context.isAdmin;
  }

  // Per-school authorization: a global super-admin (admin:true, or a roster entry
  // with role super_admin) OR an account whose `schools` claim array (or single
  // `school` string claim) includes the school, OR a roster entry scoped to it.
  async function isSchoolAdmin(schoolIdToCheck, user) {
    const current = user || (firebase && firebase.auth ? firebase.auth().currentUser : null);
    if (!current) return false;
    const claims = (await readClaims(current)) || {};
    if (isClaimForSchool(claims, schoolIdToCheck)) return true;
    const record = await readAdminRecord(current);
    if (!record) return false;
    if (record.role === 'super_admin') return true;
    return record.schoolId === schoolIdToCheck;
  }

  // Approves an account by writing its roster entry. Only a global admin may do
  // this (enforced again by the Firestore rules).
  async function approveAdminUser(emailToApprove, schoolToAssign = schoolId) {
    const cleanEmail = (emailToApprove || '').toLowerCase().trim();
    if (!cleanEmail) throw new Error('Valid email address is required.');

    const context = await getAdminContext();
    if (!context.isGlobal) {
      throw new Error('Only a global administrator can approve accounts.');
    }

    if (configured && db) {
      await db.collection('admins').doc(cleanEmail).set({
        email: cleanEmail,
        approved: true,
        approvedBy: context.email || 'system',
        approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
        role: 'admin',
        schoolId: schoolToAssign
      }, { merge: true });

      try {
        await db.collection('admin_requests').doc(cleanEmail).set({
          status: 'approved',
          resolvedBy: context.email || 'system',
          resolvedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      } catch (_) {}
    }

    return { success: true, email: cleanEmail, schoolId: schoolToAssign };
  }

  // Files an access request. Firestore only accepts a request for the signed-in
  // account, so anonymous requests are emailed to the reviewer instead.
  async function recordAdminRequest(emailToRequest, schoolToAssign = schoolId, note = '') {
    const cleanEmail = (emailToRequest || '').toLowerCase().trim();
    if (!cleanEmail) return { recorded: false, email: cleanEmail };

    let recorded = false;
    if (configured && db) {
      const current = firebase && firebase.auth ? firebase.auth().currentUser : null;
      const signedInEmail = current && current.email ? current.email.toLowerCase().trim() : '';
      if (signedInEmail && signedInEmail === cleanEmail) {
        try {
          await db.collection('admin_requests').doc(cleanEmail).set({
            email: cleanEmail,
            schoolId: schoolToAssign,
            note: note || 'Requested via GameDay+ Admin portal',
            status: 'pending',
            requestedAt: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
          recorded = true;
        } catch (err) {
          console.warn('Could not write to Firestore admin_requests collection:', err);
        }
      }
    }

    return { recorded, email: cleanEmail };
  }

  async function getApprovedAdmins() {
    const results = [];
    if (configured && db) {
      try {
        const snap = await db.collection('admins').get();
        snap.forEach(d => results.push({ id: d.id, ...d.data() }));
      } catch (err) {
        console.warn('Could not list the admin roster:', err);
      }
    }
    return results;
  }

  async function getAdminRequests() {
    const results = [];
    if (configured && db) {
      try {
        const snap = await db.collection('admin_requests').get();
        snap.forEach(d => results.push({ id: d.id, ...d.data() }));
      } catch (err) {
        console.warn('Could not list admin requests:', err);
      }
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

  return {
    schoolId,
    isConfigured,
    auth,
    signInWithEmail,
    signInWithGoogle,
    signOut,
    onAuthStateChanged,
    isAdminUser,
    getAdminContext,
    isSchoolAdmin,
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