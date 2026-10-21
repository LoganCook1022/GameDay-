# Phase 1 Runbook

This runbook covers running Firestore rules tests with the emulator, provisioning admin
claims before rule deployment, and testing token refresh / school-scoped access without
modifying production data.

## 1. Prerequisites

- A machine with Java (JRE 11+) installed — required by the Firestore emulator.
- Project dependencies:

  ```bash
  npm install
  ```

  This installs `firebase-tools`, `@firebase/rules-unit-testing`, and `firebase`
  (all devDependencies).

- A service account JSON key for the Firebase project. **Store it outside the repo.**
  Either set `FIREBASE_SERVICE_ACCOUNT` in `.env` or pass it per-invocation with `--sa`.

### Known gaps on the current workstation

| Requirement | Status |
| --- | --- |
| Java (for the Firestore emulator) | **Not installed** — rules tests skip instead of running |
| `FIREBASE_SERVICE_ACCOUNT` / service account JSON | **Not present** — claim provisioning cannot run yet |

Until Java is installed, `npm run test:rules` reports the 8 rules tests as *skipped*
with an explanatory message and exits 0. That is intentional: the unit suite must stay
green in CI-like environments without an emulator.

## 2. Run the 8 Firestore rules tests with the emulator

```bash
npm install
npx firebase emulators:exec --only firestore "node --test tests/rules/**/*.test.js"
```

Or, using the npm script:

```bash
npx firebase emulators:exec --only firestore "npm run test:rules"
```

Expected: **8 passed / 0 skipped**. Test project ID: `gameday-rules-test`.

## 3. Provision super-admin and school-admin claims (before deploying rules)

```bash
node services/set-claims.js you@example.com --admin --sa /secure/sa.json
node services/set-claims.js coach@example.com --school sugar-salem --sa /secure/sa.json
node services/set-claims.js ad@example.com --school teton --school madison --sa /secure/sa.json
node services/set-claims.js ad@example.com --all-schools --sa /secure/sa.json
node services/set-claims.js coach@example.com --remove-school sugar-salem --sa /secure/sa.json
node services/set-claims.js you@example.com --remove-admin --sa /secure/sa.json
```

Verify (read-only):

```bash
export FIREBASE_SERVICE_ACCOUNT=/secure/sa.json
node -e "const {initializeApp,cert}=require('firebase-admin/app');const {getAuth}=require('firebase-admin/auth');initializeApp({credential:cert(require(process.env.FIREBASE_SERVICE_ACCOUNT))});getAuth().getUserByEmail('coach@example.com').then(u=>console.log(u.uid,JSON.stringify(u.customClaims)))"
```

**Important:** claims are baked into the ID token. The user must sign out and sign back
in (or refresh their token) before the new claims take effect. **Provision claims before
deploying rules** — otherwise every admin loses write access the moment the rules go
live.

## 4. Test token refresh and school-scoped access (no production changes)

- **4a.** Covered by the emulator rules tests (section 2).
- **4b.** Use the Auth + Firestore emulators to create a user, set claims, sign in,
  force a token refresh (`getIdTokenResult(true)`), and verify allowed/denied writes.
- **4c.** For production, only perform read-only checks on accounts that are already
  provisioned. Never modify production claims or data for testing.

## 5. Deployment order

1. Provision claims (`services/set-claims.js`).
2. Deploy rules: `npx firebase deploy --only firestore:rules`.
3. Have every admin sign out and back in so the new claims are picked up.

Never deploy rules before step 1 — the rules fail closed, so an admin without a valid
claim is locked out immediately.

## 6. Verifying the deployed rules without touching data

Read-only probes confirm what the deployed rules actually allow. Unauthenticated
requests use the project's public web API key:

```bash
# Public: should return 200
curl "https://firestore.googleapis.com/v1/projects/PROJECT_ID/databases/(default)/documents/schools/sugar-salem/events?key=API_KEY"

# Should return 403 (admin-only collection)
curl "https://firestore.googleapis.com/v1/projects/PROJECT_ID/databases/(default)/documents/schools/sugar-salem/sports?key=API_KEY"

# Should return 403 (admin roster is not public)
curl "https://firestore.googleapis.com/v1/projects/PROJECT_ID/databases/(default)/documents/admins?key=API_KEY"
```
