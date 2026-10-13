require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { KNOWN_SCHOOL_IDS, isKnownSchool } = require('../assets/js/utils.js');

const SERVICE_ACCOUNT_PATH = process.env.FIREBASE_SERVICE_ACCOUNT || '';

function parseFlags(argv) {
  const flags = {
    email: null,
    admin: null,          // true = grant, false = revoke, null = leave unchanged
    addSchools: [],       // school ids to add to the `schools` claim
    removeSchools: [],    // school ids to remove from the `schools` claim
    allSchools: false,    // set `schools` to every known school
    sa: SERVICE_ACCOUNT_PATH
  };
  const positional = [];

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--admin') flags.admin = true;
    else if (arg === '--remove-admin') flags.admin = false;
    else if (arg === '--all-schools') flags.allSchools = true;
    else if (arg === '--school') flags.addSchools.push(argv[++i]);
    else if (arg.startsWith('--school=')) flags.addSchools.push(arg.slice('--school='.length));
    else if (arg === '--remove-school') flags.removeSchools.push(argv[++i]);
    else if (arg.startsWith('--remove-school=')) flags.removeSchools.push(arg.slice('--remove-school='.length));
    else if (arg.startsWith('--sa=')) flags.sa = arg.slice('--sa='.length);
    else if (arg === '--sa') flags.sa = argv[++i];
    else positional.push(arg);
  }

  if (!flags.email) flags.email = positional[1];
  return flags;
}

function resolveServiceAccount(saPath) {
  if (!saPath) {
    throw new Error(
      'No service account specified. Download one from Firebase Console > Project settings > Service accounts > "Generate new private key", then:\n' +
      '  - set FIREBASE_SERVICE_ACCOUNT=c:\\path\\to\\serviceAccountKey.json in .env, or\n' +
      '  - pass it with: --sa "c:\\path\\to\\serviceAccountKey.json"'
    );
  }
  const resolved = path.resolve(saPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Service account file not found: ${resolved}`);
  }
  return require(resolved);
}

function assertKnownSchools(ids) {
  ids.forEach(id => {
    if (!id || !isKnownSchool(id)) {
      throw new Error(`Unknown school id "${id}". Known ids: ${KNOWN_SCHOOL_IDS.join(', ')}`);
    }
  });
}

function usage() {
  return [
    'Usage: node services/set-claims.js <email> [options]',
    '',
    'Global super-admin:',
    '  --admin                       Grant global admin (admin: true)',
    '  --remove-admin                Revoke global admin',
    '',
    'School-scoped admin (per-school):',
    '  --school <id>                 Add a school to the `schools` claim (repeatable)',
    '  --remove-school <id>          Remove a school from the `schools` claim (repeatable)',
    '  --all-schools                 Set `schools` to every known school',
    '',
    'Common:',
    '  --sa <path>                   Path to service account JSON (or FIREBASE_SERVICE_ACCOUNT)',
    '',
    `Known school ids: ${KNOWN_SCHOOL_IDS.join(', ')}`,
    '',
    'NOTE: claims are baked into the ID token. The user must sign out and sign',
    'back in (or refresh their token) before the new claims take effect.'
  ].join('\n');
}

async function main() {
  const flags = parseFlags(process.argv);

  if (!flags.email) {
    console.error(usage());
    process.exit(1);
  }

  const changingAdmin = flags.admin !== null;
  const changingSchools = flags.allSchools || flags.addSchools.length || flags.removeSchools.length;
  if (!changingAdmin && !changingSchools) {
    console.error('Nothing to do. Pass --admin/--remove-admin and/or --school/--remove-school/--all-schools.\n');
    console.error(usage());
    process.exit(1);
  }

  assertKnownSchools(flags.addSchools);
  assertKnownSchools(flags.removeSchools);

  initializeApp({ credential: cert(resolveServiceAccount(flags.sa)) });

  const user = await getAuth().getUserByEmail(flags.email.trim());
  const nextClaims = { ...(user.customClaims || {}) };

  if (changingAdmin) {
    if (flags.admin) nextClaims.admin = true;
    else delete nextClaims.admin;
  }

  if (changingSchools) {
    let schools = Array.isArray(nextClaims.schools) ? nextClaims.schools.slice() : [];
    if (flags.allSchools) schools = KNOWN_SCHOOL_IDS.slice();
    flags.addSchools.forEach(id => { if (!schools.includes(id)) schools.push(id); });
    if (flags.removeSchools.length) {
      schools = schools.filter(id => !flags.removeSchools.includes(id));
    }
    // De-dupe and keep canonical order for stable output.
    schools = KNOWN_SCHOOL_IDS.filter(id => schools.includes(id));
    if (schools.length) nextClaims.schools = schools;
    else delete nextClaims.schools;
  }

  await getAuth().setCustomUserClaims(user.uid, nextClaims);

  const summary = [];
  if (changingAdmin) summary.push(flags.admin ? 'granted global admin' : 'removed global admin');
  if (changingSchools) summary.push(`schools=[${(nextClaims.schools || []).join(', ') || 'none'}]`);

  console.log(`[set-claims] Updated ${flags.email} (uid: ${user.uid}): ${summary.join('; ')}.`);
  console.log('[set-claims] Claims are applied to new ID tokens. The user must sign out and sign back in for changes to take effect.');
  process.exit(0);
}

main().catch(error => {
  console.error('[set-claims] Failed:', error.message);
  process.exit(1);
});
