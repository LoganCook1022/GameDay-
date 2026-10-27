'use strict';

require('dotenv').config();

/**
 * GameDay+ - Push notification queue watcher
 *
 * Runs the drain loop on a timer so admins never touch the terminal after
 * starting it once. Every interval it looks for `pending` alerts in
 * schools/{schoolId}/notification_queue and delivers them, exactly like
 * `send-notifications.js --drain`, then marks them sent.
 *
 * Usage:
 *   node services/notify-watcher.js --school sugar-salem --interval 30 --sa "path\to\key.json"
 *
 * Stop it with Ctrl+C. If FIREBASE_SERVICE_ACCOUNT is set in .env you can omit --sa.
 * Prefer a Cloud Function for production; this is the zero-cost local option.
 */

const fs = require('fs');
const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

const SERVICE_ACCOUNT_PATH = process.env.FIREBASE_SERVICE_ACCOUNT || '';
const DEFAULT_SCHOOL_ID = process.env.GAMEDAY_SCHOOL_ID || 'sugar-salem';

function parseArgs(argv) {
  const flags = { school: DEFAULT_SCHOOL_ID, interval: 30, sa: SERVICE_ACCOUNT_PATH, once: false };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--once') flags.once = true;
    else if (arg.startsWith('--school=')) flags.school = arg.slice('--school='.length);
    else if (arg === '--school') flags.school = argv[++i];
    else if (arg.startsWith('--interval=')) flags.interval = Number(arg.slice('--interval='.length));
    else if (arg === '--interval') flags.interval = Number(argv[++i]);
    else if (arg.startsWith('--sa=')) flags.sa = arg.slice('--sa='.length);
    else if (arg === '--sa') flags.sa = argv[++i];
  }
  if (!Number.isFinite(flags.interval) || flags.interval < 5) flags.interval = 30;
  return flags;
}

function resolveServiceAccount(saPath) {
  if (!saPath) {
    throw new Error('No service account specified. Set FIREBASE_SERVICE_ACCOUNT in .env, or pass --sa=...');
  }
  const resolved = path.resolve(saPath);
  if (!fs.existsSync(resolved)) throw new Error(`Service account file not found: ${resolved}`);
  return require(resolved);
}

async function deliverQueued(db, messaging, schoolId) {
  const subscribersPath = `schools/${schoolId}/subscribers`;
  const queuePath = `schools/${schoolId}/notification_queue`;

  const queueSnap = await db.collection(queuePath).where('status', '==', 'pending').get();
  if (queueSnap.empty) return 0;

  const subSnap = await db.collection(subscribersPath).get();
  const tokens = subSnap.docs
    .map(doc => doc.data() || {})
    .filter(data => data.active !== false && data.token)
    .map(data => data.token);

  let delivered = 0;
  for (const doc of queueSnap.docs) {
    const note = doc.data() || {};
    if (tokens.length) {
      const url = note.url || `/?school=${encodeURIComponent(schoolId)}`;
      const response = await messaging.sendEachForMulticast({
        tokens,
        notification: { title: note.title || 'GameDay+ update', body: note.body || 'Your schedule changed.' },
        data: {
          title: note.title || 'GameDay+ update',
          body: note.body || 'Your schedule changed.',
          eventId: note.eventId || '',
          url,
          tag: note.eventId ? `event-${note.eventId}` : 'gameday-update'
        },
        webpush: {
          fcmOptions: { link: url },
          notification: { icon: '/assets/img/icon-192.png', badge: '/assets/img/icon-192.png' }
        }
      });

      const batch = db.batch();
      response.responses.forEach((result, index) => {
        const code = result.error && result.error.code;
        if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token') {
          batch.set(db.doc(`${subscribersPath}/${tokens[index]}`), { active: false }, { merge: true });
        }
      });
      await batch.commit();

      await doc.ref.set({ status: 'sent', sentCount: response.successCount, sentAt: new Date() }, { merge: true });
      console.log(`[${new Date().toLocaleTimeString()}] Sent "${note.title}" -> ${response.successCount} ok, ${response.failureCount} failed.`);
    } else {
      await doc.ref.set({ status: 'sent', sentCount: 0, sentAt: new Date() }, { merge: true });
      console.log(`[${new Date().toLocaleTimeString()}] "${note.title}" had 0 subscribers; marked sent.`);
    }
    delivered += 1;
  }
  return delivered;
}

async function main() {
  const flags = parseArgs(process.argv);
  let credentials;
  try {
    credentials = resolveServiceAccount(flags.sa);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }

  const app = initializeApp({ credential: cert(credentials) });
  const db = getFirestore(app);
  const messaging = getMessaging(app);

  console.log(`Watching queue for "${flags.school}" every ${flags.interval}s. Press Ctrl+C to stop.`);

  const tick = async () => {
    try {
      const n = await deliverQueued(db, messaging, flags.school);
      if (n) console.log(`  (${n} alert(s) handled)`);
    } catch (err) {
      console.error('Watcher tick error:', err.message);
    }
  };

  await tick();
  if (flags.once) return;
  setInterval(tick, flags.interval * 1000);
}

main().catch(err => {
  console.error('Watcher error:', err);
  process.exit(1);
});
