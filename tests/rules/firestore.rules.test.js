'use strict';

/**
 * Firestore security-rules tests.
 *
 * These require the Firebase Firestore emulator and two npm packages that are
 * NOT installed by default (`@firebase/rules-unit-testing` and `firebase`).
 * When either is missing — or the emulator is not running — every test here is
 * skipped, so `npm test` still works in a bare checkout.
 *
 * Run them with:
 *   npm install
 *   npm run test:rules          # with the emulator already running, or:
 *   npx firebase emulators:exec --only firestore "npm run test:rules"
 *
 * See tests/README.md.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');

let testing = null;
let fs = null;
try {
  testing = require('@firebase/rules-unit-testing');
  fs = require('firebase/firestore');
} catch (_) {
  testing = null;
  fs = null;
}

const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
const canRun = Boolean(testing && fs && emulatorHost);
const skip = canRun
  ? false
  : 'requires @firebase/rules-unit-testing + firebase + a running Firestore emulator (see tests/README.md)';

const rules = readFileSync(resolve(__dirname, '..', '..', 'firestore.rules'), 'utf8');

let testEnv;

test.before(async () => {
  if (!canRun) return;
  testEnv = await testing.initializeTestEnvironment({
    projectId: 'gameday-rules-test',
    firestore: { rules }
  });
});

test.after(async () => {
  if (testEnv) await testEnv.cleanup();
});

async function seedEvent() {
  await testEnv.withSecurityRulesDisabled(async ctx => {
    const db = ctx.firestore();
    await fs.setDoc(fs.doc(db, 'schools/sugar-salem/events/g1'), { sport: 'Basketball', opponent: 'Rigby' });
  });
}

async function seedRoster(entries) {
  await testEnv.withSecurityRulesDisabled(async ctx => {
    const db = ctx.firestore();
    for (const [email, data] of Object.entries(entries)) {
      await fs.setDoc(fs.doc(db, `admins/${email}`), data);
    }
  });
}

// Rules match the signed-in account by its email claim, so every test context
// carries one (the uid alone is not enough to reach the roster).
function contextFor(email, claims = {}) {
  return testEnv.authenticatedContext(`uid-${email}`, { email, ...claims });
}

test('anonymous can read public events and settings', { skip }, async () => {
  await seedEvent();
  const db = testEnv.unauthenticatedContext().firestore();
  await testing.assertSucceeds(fs.getDoc(fs.doc(db, 'schools/sugar-salem/events/g1')));
  await testing.assertSucceeds(fs.getDoc(fs.doc(db, 'schools/sugar-salem/settings/school')));
});

test('anonymous cannot read admin-only collections', { skip }, async () => {
  const db = testEnv.unauthenticatedContext().firestore();
  await testing.assertFails(fs.getDoc(fs.doc(db, 'schools/sugar-salem/sports/s1')));
  await testing.assertFails(fs.getDoc(fs.doc(db, 'schools/sugar-salem/settings/private')));
});

test('anonymous cannot read the admin roster or requests', { skip }, async () => {
  const db = testEnv.unauthenticatedContext().firestore();
  await testing.assertFails(fs.getDoc(fs.doc(db, 'admins/cook.logan@sugarsalem.com')));
  await testing.assertFails(fs.getDoc(fs.doc(db, 'admin_requests/someone@sugarsalem.com')));
  await testing.assertFails(fs.getDocs(fs.collection(db, 'admins')));
});

test('anonymous cannot write events or sports', { skip }, async () => {
  const db = testEnv.unauthenticatedContext().firestore();
  await testing.assertFails(fs.setDoc(fs.doc(db, 'schools/sugar-salem/events/g2'), { sport: 'X' }));
  await testing.assertFails(fs.setDoc(fs.doc(db, 'schools/sugar-salem/sports/s2'), { name: 'X' }));
});

test('a signed-in non-admin still cannot write', { skip }, async () => {
  const db = contextFor('someone@sugarsalem.com').firestore();
  await testing.assertFails(fs.setDoc(fs.doc(db, 'schools/sugar-salem/events/g3'), { sport: 'X' }));
});

test('global super-admin can write any school', { skip }, async () => {
  const db = contextFor('super-1@sugarsalem.com', { admin: true }).firestore();
  await testing.assertSucceeds(fs.setDoc(fs.doc(db, 'schools/teton/events/g4'), { sport: 'X' }));
  await testing.assertSucceeds(fs.setDoc(fs.doc(db, 'schools/sugar-salem/sports/s3'), { name: 'X' }));
});

test('school admin can write their own school only', { skip }, async () => {
  const db = contextFor('school-admin@sugarsalem.com', { schools: ['teton'] }).firestore();
  await testing.assertSucceeds(fs.setDoc(fs.doc(db, 'schools/teton/events/g5'), { sport: 'X' }));
  await testing.assertFails(fs.setDoc(fs.doc(db, 'schools/sugar-salem/events/g6'), { sport: 'X' }));
});

test('single-string school claim is honored', { skip }, async () => {
  const db = contextFor('school-admin-2@sugarsalem.com', { school: 'madison' }).firestore();
  await testing.assertSucceeds(fs.setDoc(fs.doc(db, 'schools/madison/events/g7'), { sport: 'X' }));
  await testing.assertFails(fs.setDoc(fs.doc(db, 'schools/rigby/events/g8'), { sport: 'X' }));
});

test('roster super_admin can write any school without a claim', { skip }, async () => {
  await seedRoster({
    'roster-super@sugarsalem.com': { approved: true, role: 'super_admin', schoolId: 'sugar-salem' }
  });
  const db = contextFor('roster-super@sugarsalem.com').firestore();
  await testing.assertSucceeds(fs.setDoc(fs.doc(db, 'schools/teton/events/g9'), { sport: 'X' }));
  await testing.assertSucceeds(fs.setDoc(fs.doc(db, 'admins/new-admin@sugarsalem.com'), { approved: true }));
});

test('roster school admin is limited to their own school', { skip }, async () => {
  await seedRoster({
    'roster-teton@sugarsalem.com': { approved: true, role: 'admin', schoolId: 'teton' }
  });
  const db = contextFor('roster-teton@sugarsalem.com').firestore();
  await testing.assertSucceeds(fs.setDoc(fs.doc(db, 'schools/teton/events/g10'), { sport: 'X' }));
  await testing.assertFails(fs.setDoc(fs.doc(db, 'schools/rigby/events/g11'), { sport: 'X' }));
});

test('a roster entry that is not approved grants nothing', { skip }, async () => {
  await seedRoster({
    'roster-pending@sugarsalem.com': { approved: false, role: 'admin', schoolId: 'teton' }
  });
  const db = contextFor('roster-pending@sugarsalem.com').firestore();
  await testing.assertFails(fs.setDoc(fs.doc(db, 'schools/teton/events/g12'), { sport: 'X' }));
  await testing.assertFails(fs.setDoc(fs.doc(db, 'admins/other@sugarsalem.com'), { approved: true }));
});

test('an account may read only its own roster entry', { skip }, async () => {
  await seedRoster({
    'roster-self@sugarsalem.com': { approved: true, role: 'admin', schoolId: 'teton' },
    'roster-other@sugarsalem.com': { approved: true, role: 'admin', schoolId: 'teton' }
  });
  const db = contextFor('roster-self@sugarsalem.com').firestore();
  await testing.assertSucceeds(fs.getDoc(fs.doc(db, 'admins/roster-self@sugarsalem.com')));
  await testing.assertFails(fs.getDoc(fs.doc(db, 'admins/roster-other@sugarsalem.com')));
  await testing.assertFails(fs.getDocs(fs.collection(db, 'admins')));
});

test('a signed-in account may file only its own access request', { skip }, async () => {
  const db = contextFor('applicant@sugarsalem.com').firestore();
  await testing.assertSucceeds(fs.setDoc(fs.doc(db, 'admin_requests/applicant@sugarsalem.com'), { status: 'pending' }));
  await testing.assertFails(fs.setDoc(fs.doc(db, 'admin_requests/someone-else@sugarsalem.com'), { status: 'pending' }));
});

test('a non-admin cannot approve accounts', { skip }, async () => {
  const db = contextFor('applicant@sugarsalem.com').firestore();
  await testing.assertFails(fs.setDoc(fs.doc(db, 'admins/applicant@sugarsalem.com'), { approved: true }));
});

test('unknown/denied top-level paths fail closed', { skip }, async () => {
  const db = contextFor('super-2@sugarsalem.com', { admin: true }).firestore();
  await testing.assertFails(fs.getDoc(fs.doc(db, 'randomTopLevel/xyz')));
});
