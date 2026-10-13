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

test('anonymous cannot write events or sports', { skip }, async () => {
  const db = testEnv.unauthenticatedContext().firestore();
  await testing.assertFails(fs.setDoc(fs.doc(db, 'schools/sugar-salem/events/g2'), { sport: 'X' }));
  await testing.assertFails(fs.setDoc(fs.doc(db, 'schools/sugar-salem/sports/s2'), { name: 'X' }));
});

test('a signed-in non-admin still cannot write', { skip }, async () => {
  const db = testEnv.authenticatedContext('user-1', {}).firestore();
  await testing.assertFails(fs.setDoc(fs.doc(db, 'schools/sugar-salem/events/g3'), { sport: 'X' }));
});

test('global super-admin can write any school', { skip }, async () => {
  const db = testEnv.authenticatedContext('super-1', { admin: true }).firestore();
  await testing.assertSucceeds(fs.setDoc(fs.doc(db, 'schools/teton/events/g4'), { sport: 'X' }));
  await testing.assertSucceeds(fs.setDoc(fs.doc(db, 'schools/sugar-salem/sports/s3'), { name: 'X' }));
});

test('school admin can write their own school only', { skip }, async () => {
  const db = testEnv.authenticatedContext('school-admin', { schools: ['teton'] }).firestore();
  await testing.assertSucceeds(fs.setDoc(fs.doc(db, 'schools/teton/events/g5'), { sport: 'X' }));
  await testing.assertFails(fs.setDoc(fs.doc(db, 'schools/sugar-salem/events/g6'), { sport: 'X' }));
});

test('single-string school claim is honored', { skip }, async () => {
  const db = testEnv.authenticatedContext('school-admin-2', { school: 'madison' }).firestore();
  await testing.assertSucceeds(fs.setDoc(fs.doc(db, 'schools/madison/events/g7'), { sport: 'X' }));
  await testing.assertFails(fs.setDoc(fs.doc(db, 'schools/rigby/events/g8'), { sport: 'X' }));
});

test('unknown/denied top-level paths fail closed', { skip }, async () => {
  const db = testEnv.authenticatedContext('super-2', { admin: true }).firestore();
  await testing.assertFails(fs.getDoc(fs.doc(db, 'randomTopLevel/xyz')));
});
