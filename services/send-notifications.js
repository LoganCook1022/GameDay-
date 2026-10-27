'use strict';

require('dotenv').config();

/**
 * GameDay+ - Push notification sender (Firebase Cloud Messaging)
 *
 * Admin-side tool that fans out a web-push notification to every device that
 * opted in for a school. Subscribers live in
 * `schools/{schoolId}/subscribers/{token}` and are written by the public app
 * (assets/js/notifications.js).
 *
 * Usage:
 *   node services/send-notifications.js --school sugar-salem \
 *        --title "Game moved" \
 *        --body "Varsity Football vs Teton moved to 6:00 PM" \
 *        --event sugar-salem-fb-002 [--url "/?school=sugar-salem"] [--dry-run]
 *
 * Requires a Firebase service account (FCM send is admin-only) and
 * firebase-admin, which is already a dependency.
 */

const fs = require('fs');
const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

const SERVICE_ACCOUNT_PATH = process.env.FIREBASE_SERVICE_ACCOUNT || '';
const DEFAULT_SCHOOL_ID = process.env.GAMEDAY_SCHOOL_ID || 'sugar-salem';

function parseArgs(argv) {
  const flags = {
    school: DEFAULT_SCHOOL_ID,
    title: '',
    body: '',
    eventId: '',
    url: '',
    dryRun: false,
    drain: false,
    sa: SERVICE_ACCOUNT_PATH
  };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') flags.dryRun = true;
    else if (arg === '--drain') flags.drain = true;
    else if (arg.startsWith('--school=')) flags.school = arg.slice('--school='.length);
    else if (arg === '--school') flags.school = argv[++i];
    else if (arg.startsWith('--title=')) flags.title = arg.slice('--title='.length);
    else if (arg === '--title') flags.title = argv[++i];
    else if (arg.startsWith('--body=')) flags.body = arg.slice('--body='.length);
    else if (arg === '--body') flags.body = argv[++i];
    else if (arg.startsWith('--event=')) flags.eventId = arg.slice('--event='.length);
    else if (arg === '--event') flags.eventId = argv[++i];
    else if (arg.startsWith('--url=')) flags.url = arg.slice('--url='.length);
    else if (arg === '--url') flags.url = argv[++i];
    else if (arg.startsWith('--sa=')) flags.sa = arg.slice('--sa='.length);
    else if (arg === '--sa') flags.sa = argv[++i];
  }
  return flags;
}

function resolveServiceAccount(saPath) {
  if (!saPath) {
    throw new Error(
      'No service account specified. Set FIREBASE_SERVICE_ACCOUNT=c:\\path\\to\\serviceAccountKey.json in .env, or pass --sa=...'
    );
  }
  const resolved = path.resolve(saPath);
  if (!fs.existsSync(resolved)) throw new Error(`Service account file not found: ${resolved}`);
  return require(resolved);
}

// FCM allows at most 500 tokens per multicast request.
async function sendInChunks(messaging, tokens, message, dryRun) {
  const chunkSize = 500;
  let sent = 0;
  let failed = 0;
  const staleTokens = [];

  for (let i = 0; i < tokens.length; i += chunkSize) {
    const chunk = tokens.slice(i, i + chunkSize);
    if (dryRun) {
      sent += chunk.length;
      continue;
    }
    const response = await messaging.sendEachForMulticast({
      tokens: chunk,
      notification: message.notification,
      data: message.data,
      webpush: message.webpush
    });
    sent += response.successCount;
    failed += response.failureCount;
    response.responses.forEach((result, index) => {
      if (result.success) return;
      const code = result.error && result.error.code;
      console.warn(`  [failure] token ${chunk[index].slice(0, 16)}... -> ${code || 'unknown error'}${result.error && result.error.message ? ': ' + result.error.message : ''}`);
      if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token') {
        staleTokens.push(chunk[index]);
      }
    });
  }

  return { sent, failed, staleTokens };
}

async function main() {
  const flags = parseArgs(process.argv);
  if (!flags.drain && !flags.title && !flags.body) {
    console.error('Provide at least --title or --body for the notification (or use --drain to send queued alerts).');
    process.exit(1);
  }

  let credentials;
  try {
    credentials = resolveServiceAccount(flags.sa || SERVICE_ACCOUNT_PATH);
    console.log(`Using service account: ${path.resolve(flags.sa || SERVICE_ACCOUNT_PATH)}`);
  } catch (err) {
    console.warn(`\n[Notice] ${err.message}`);
    console.log('\nTip: admins can also queue alerts from GameDay+ Admin > Notifications, then run this with --drain.\n');
    process.exit(0);
  }

  const app = initializeApp({ credential: cert(credentials) });
  const db = getFirestore(app);
  const messaging = getMessaging(app);

  const subscribersPath = `schools/${flags.school}/subscribers`;
  const snapshot = await db.collection(subscribersPath).get();
  const tokens = snapshot.docs
    .filter(doc => doc.data() && doc.data().active !== false && doc.data().token)
    .map(doc => doc.data().token);

  console.log(`Found ${tokens.length} active subscriber(s) for "${flags.school}".`);

  // --drain: read pending alerts queued by the admin dashboard and deliver each.
  if (flags.drain) {
    const queuePath = `schools/${flags.school}/notification_queue`;
    const queueSnap = await db.collection(queuePath).where('status', '==', 'pending').get();
    if (queueSnap.empty) {
      console.log('No pending alerts in the queue.');
      return;
    }
    console.log(`Delivering ${queueSnap.size} queued alert(s)...`);

    for (const doc of queueSnap.docs) {
      const note = doc.data() || {};
      const url = note.url || `/?school=${encodeURIComponent(flags.school)}`;
      const message = {
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
      };
      const result = tokens.length
        ? await sendInChunks(messaging, tokens, message, flags.dryRun)
        : { sent: 0, failed: 0, staleTokens: [] };
      console.log(`  "${note.title}" -> ${flags.dryRun ? '[dry-run] ' : ''}${result.sent} sent, ${result.failed} failed.`);
      if (!flags.dryRun) {
        if (result.staleTokens.length) {
          const batch = db.batch();
          result.staleTokens.forEach(token => {
            batch.set(db.doc(`${subscribersPath}/${token}`), { active: false }, { merge: true });
          });
          await batch.commit();
          console.log(`  Deactivated ${result.staleTokens.length} stale token(s).`);
        }
        await db.doc(`${queuePath}/${doc.id}`).set({
          status: 'sent',
          sentCount: result.sent,
          sentAt: new Date()
        }, { merge: true });
      }
    }
    return;
  }

  if (!tokens.length) {
    console.log('Nothing to send.');
    return;
  }

  const url = flags.url || `/?school=${encodeURIComponent(flags.school)}`;
  const message = {
    notification: { title: flags.title || 'GameDay+ update', body: flags.body || 'Your schedule changed.' },
    data: {
      title: flags.title || 'GameDay+ update',
      body: flags.body || 'Your schedule changed.',
      eventId: flags.eventId || '',
      url,
      tag: flags.eventId ? `event-${flags.eventId}` : 'gameday-update'
    },
    webpush: {
      fcmOptions: { link: url },
      notification: { icon: '/assets/img/icon-192.png', badge: '/assets/img/icon-192.png' }
    }
  };

  const result = await sendInChunks(messaging, tokens, message, flags.dryRun);
  console.log(`${flags.dryRun ? '[dry-run] would send' : 'Sent'} ${result.sent} notification(s); ${result.failed} failed.`);

  // Deactivate tokens FCM reported as dead so future sends skip them.
  if (result.staleTokens.length && !flags.dryRun) {
    const batch = db.batch();
    result.staleTokens.forEach(token => {
      batch.set(db.doc(`${subscribersPath}/${token}`), { active: false }, { merge: true });
    });
    await batch.commit();
    console.log(`Deactivated ${result.staleTokens.length} stale token(s).`);
  }
}

main().catch(err => {
  console.error('Notification send error:', err);
  process.exit(1);
});
