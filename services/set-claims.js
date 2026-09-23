require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

const SERVICE_ACCOUNT_PATH = process.env.FIREBASE_SERVICE_ACCOUNT || '';

function parseFlags(argv) {
  const flags = { email: null, admin: null, sa: SERVICE_ACCOUNT_PATH };
  const positional = [];

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--admin') flags.admin = true;
    else if (arg === '--remove-admin') flags.admin = false;
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

async function main() {
  const { email, admin, sa } = parseFlags(process.argv);

  if (!email) {
    console.error('Usage: node services/set-claims.js <email> [--admin] [--remove-admin] [--sa path/to/serviceAccountKey.json]');
    process.exit(1);
  }

  if (admin === null) {
    console.error('Specify either --admin to grant access or --remove-admin to revoke it.');
    process.exit(1);
  }

  initializeApp({ credential: cert(resolveServiceAccount(sa)) });

  const user = await getAuth().getUserByEmail(email.trim());
  const nextClaims = { ...(user.customClaims || {}) };
  if (admin) nextClaims.admin = true;
  else delete nextClaims.admin;

  await getAuth().setCustomUserClaims(user.uid, nextClaims);

  console.log(`[set-claims] ${admin ? 'Granted' : 'Removed'} admin access for ${email} (uid: ${user.uid}).`);
  console.log('[set-claims] The user must sign out and sign back in for the change to take effect.');
  process.exit(0);
}

main().catch(error => {
  console.error('[set-claims] Failed:', error.message);
  process.exit(1);
});