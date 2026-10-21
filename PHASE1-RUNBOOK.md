# Phase 1 Runbook

This runbook covers running the Firestore rules tests with the emulator, provisioning admin
claims, and verifying the deployed rules without modifying production data.

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
| Java (for the Firestore emulator) | **Available** — portable Temurin 17 unpacked at `%LOCALAPPDATA%\Temp\opencode\jdk17\jdk-17.0.20.1+1` (no system install) |
| `FIREBASE_SERVICE_ACCOUNT` / service account JSON | **Not present** — claim provisioning cannot run yet |

Set `JAVA_HOME` to the JDK directory before running the emulator:

```bash
export JAVA_HOME="$LOCALAPPDATA/Temp/opencode/jdk17/jdk-17.0.20.1+1"
export PATH="$JAVA_HOME/bin:$PATH"
```

If the emulator dependencies are missing, `npm run test:rules` reports the rules tests as
*skipped* with an explanatory message and exits 0. That is intentional: the unit suite must
stay green in CI-like environments without an emulator.

## 2. Run the Firestore rules tests with the emulator

The emulator needs a project id and the rules from `firestore.rules`; `firebase.json` pins the
Firestore emulator to port 8080.

```bash
npm install
npx firebase emulators:exec --only firestore --project gameday-rules-test "node --test tests/rules/**/*.test.js"
```

> **Windows gotcha:** `emulators:exec` runs the command through `cmd.exe`. On locked-down
> workstations that fails with *"The command prompt has been disabled by your administrator"*.
> Start the emulator yourself instead and point the test at it:

```bash
# terminal 1 (leave running)
npx firebase emulators:start --only firestore --project gameday-rules-test

# terminal 2
export FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
npm run test:rules
```

Expected: **all rules tests passed / 0 skipped**. Test project ID: `gameday-rules-test`.

The rules suite covers the public reads (`events`, `settings/school`), the admin-only school
collections, the roster and request permissions, the claim paths, the roster paths, and an
unapproved roster entry.

## 3. Admin authorization: claims *and* the roster

`firestore.rules` accepts two independent sources of authority, in this order:

1. **Custom claims** (strongest): `admin == true` grants access to every school,
   `schools == [...]` (or a single `school` claim) grants access to the listed schools.
2. **The roster** (`admins/{email}`): a document with `approved == true`. `role == "super_admin"`
   grants global access; any other approved entry grants access to the `schoolId` stored on
   that document.

The roster exists so an administrator can be approved from the admin console without a service
account being available to mint claims. A signed-in account may read **only its own** roster
entry; listing the roster or reading requests requires global admin access.

The production roster currently holds one entry:

```
admins/cook.logan@sugarsalem.com
  approved: true, role: super_admin, schoolId: sugar-salem, approvedBy: system_root
```

Because that entry is a `super_admin`, **the rules can be deployed before any claim exists** —
that account keeps full access through the roster path. Claims remain the stronger authority and
are still worth provisioning (see below).

### Provisioning claims (optional, strengthens the model)

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
in (or refresh their token) before the new claims take effect.

### Approving an account from the admin console

A global administrator opens the admin console, signs in, and either uses the approval link
from a request email (`admin.html?action=approve&email=…&school=…`) or the **Super
Administrator Management** panel on the dashboard. Both write `admins/{email}` with
`approved: true`, `approvedBy: <the approving account>`, `role: 'admin'` and the selected
`schoolId`, then mark the matching `admin_requests/{email}` document as approved.

The approval link only opens the approval screen for a signed-in global administrator, and the
Firestore rules reject the write for anyone else.

## 4. Test token refresh and school-scoped access (no production changes)

- **4a.** Covered by the emulator rules tests (section 2).
- **4b.** Use the Auth + Firestore emulators to create a user, set claims, sign in,
  force a token refresh (`getIdTokenResult(true)`), and verify allowed/denied writes.
- **4c.** For production, only perform read-only checks on accounts that are already
  provisioned. Never modify production claims or data for testing.

## 5. Deployment order

1. Confirm the roster entry for the super administrator exists and is approved
   (`admins/cook.logan@sugarsalem.com`, `role: super_admin`).
2. Deploy the rules: `npx firebase deploy --only firestore:rules`.
3. Sign in as the super administrator and confirm the dashboard loads and data can be written.
4. Optional: provision custom claims (section 3) and have admins sign out and back in.

The rules fail closed for anyone without a claim or an approved roster entry, so confirm step 1
before deploying. The `admins` roster and `admin_requests` collections stop being world-readable
at that moment — no account loses access, but anything that was reading them anonymously
(a dashboard, a script, a spreadsheet export) must switch to an authenticated admin session.

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

# Should return 403 (pending requests are not public)
curl "https://firestore.googleapis.com/v1/projects/PROJECT_ID/databases/(default)/documents/admin_requests?key=API_KEY"
```

State of the live project before the hardened rules are deployed (verified with these probes):
`events` 200, `sports`/`clubs`/`teams`/`statistics` 200, `admins` 200, `admin_requests` 200,
`schools/sugar-salem` 403 — i.e. the roster and every school collection are currently
world-readable. After deploying the hardened rules, the four 200s above must return 403 while
`events` and `settings/school` stay 200.
