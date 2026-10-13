# GameDay+ tests

Two suites, both driven by Node's built-in test runner (`node:test`).

## Unit tests — `tests/unit/`

| File | Covers |
| ---- | ------ |
| `utils.test.js` | `GameDayUtils` HTML/attribute/quote escaping, school-id allowlist, `normalizeSchoolId`. |
| `credentials.test.js` | `GameDayCredentials` email-only store: passwords are never persisted, legacy plaintext keys are purged, remember/forget/setRemember, corrupt-JSON tolerance. |
| `render.test.js` | `GameDayRender` templates: XSS payloads cannot escape into the DOM, `safeIcon`/`safeColor` allowlists. |

### Running

```bash
node --test "tests/unit/**/*.test.js"
# or, in a normal shell where npm scripts work:
npm test
```

The string-level assertions and all of `utils`/`credentials` run with **no
dependencies**. The DOM-based XSS assertions need `jsdom`; when it is not
installed they are **skipped** (not failed), so a bare checkout still passes:

```
npm install            # installs jsdom (devDependency)
```

## Firestore rules tests — `tests/rules/`

`firestore.rules.test.js` exercises the authorization model in `firestore.rules`:
public read of `events` + `settings/school`, admin-only collections, the global
`admin` claim, and the per-school `schools` / `school` claims.

These require the Firestore emulator plus two packages that are **not** part of
the default install (kept out to keep clones light):

```bash
npm install @firebase/rules-unit-testing firebase firebase-tools
npx firebase emulators:exec --only firestore "node --test \"tests/rules/**/*.test.js\""
```

If `@firebase/rules-unit-testing`, `firebase`, or `FIRESTORE_EMULATOR_HOST`
is missing, every rules test is **skipped** with an explanatory message rather
than failing.

## Sandbox caveat (this machine)

`npm run …` cannot be used here: npm executes lifecycle scripts through
`cmd.exe`, which is disabled by policy ("The command prompt has been disabled by
your administrator"). Run the test scripts with `node --test …` directly, as
shown above. Installing packages only succeeds with `--ignore-scripts` and a
clean target directory.

## What is NOT covered yet

- Browser-level integration (DOM controllers `app.js`, `admin.js`, `signin.js`)
  is verified manually via the browser-automation skill, not in CI.
- The Google-Sheets/`ical-sync` data pipeline (Phase 2 work).
