# GameDay+ — Week 6: Risk Assessment

**Team Members:** William Eaton, Logan Cook

---

## Part 1 — Business Deliverable: Risk Assessment

Risks are rated by **Likelihood** and **Impact** (Low / Medium / High), then given a
concrete solution or control measure. We identified 9 risks across technical,
security, adoption, schedule, cost, and data categories.

| # | Risk | Category | Likelihood | Impact | Solution / Control Measure |
| --- | --- | --- | --- | --- | --- |
| R1 | **Firestore security rules are wrong or too loose**, letting anyone write or delete game data | Security | Medium | High | Rules are claim-based: public read of `events` + `settings/school`, all writes require an `admin` or school-scoped claim. We wrote automated rules tests (`tests/rules/firestore.rules.test.js`) and keep a "fail closed" catch-all that denies anything not explicitly allowed. |
| R2 | **Unauthorized users get admin access** through weak passwords or shared accounts | Security | Medium | High | Use Firebase Authentication for real sign-in. Admin rights are granted only by minting custom claims out-of-band (`services/set-claims.js`), never from the client. Passwords are never stored locally — only the email is remembered (`credentials.js`). |
| R3 | **Data entry errors** from coaches/admins (wrong date, wrong score, bad sport name) put wrong info in front of students | Data Quality | High | Medium | Add validation on the admin forms (required fields, valid date formats, numeric scores, known sport/school IDs). Normalize every event through one shared function so bad shapes can't leak into the app. |
| R4 | **Losing the data** (accidental delete, project misconfiguration, region outage) | Data Loss | Low | High | Keep a version-controlled seed/backup of the schedule in `data/events.json`. Firestore is durable and multi-region by default; we can re-seed at any time with `npm run seed:firestore`. Use soft confirmation before destructive admin actions. |
| R5 | **Low adoption** — students don't know the app exists or don't bother using it | Adoption | High | High | Zero-login design removes all friction. Advertise through school announcements, QR codes at games, and the school website. Make the public URL easy to remember and mobile-first so it loads instantly on a phone. |
| R6 | **Schedule slips** — features aren't finished by the deadline | Schedule | Medium | Medium | We split work between two members and ran backend/admin phases in parallel. Each phase has a milestone (see Week 5 timeline) so we can tell early if we're behind, and we cut or defer optional features (e.g. extra stats views) if time runs out. |
| R7 | **Cost overruns** — Firebase usage bill grows beyond the free tier | Cost | Low | Medium | The app is read-heavy but small in scale. We use the Spark/Blaze free quotas, cache reads in the client, and avoid unnecessary real-time listeners. Set Firebase budget alerts and monitor usage in the console. |
| R8 | **Dependency / Firebase outage** breaks the app for everyone | Technical | Low | High | The app falls back to a local dataset if Firestore is unreachable, so the schedule still renders during an outage. Dependencies are pinned in `package.json`, and Firebase services are battle-tested and redundant. |
| R9 | **Mobile/layout bugs** make the app hard to use on phones, where most students will open it | Technical | Medium | Medium | Build mobile-first with a responsive layout, and test at phone, tablet, and desktop sizes. The calendar, stats tables, and admin forms get special attention since they're the most layout-sensitive. |

### Risk Summary

- **Highest priority to manage now:** R1/R2 (security) and R5 (adoption) — these have
  the biggest impact on whether the project actually succeeds.
- **Most likely to happen:** R3 (data entry errors) and R5 (low adoption).
- **Lowest risk but still planned for:** R4 (data loss) and R7 (cost).

---

## Part 2 — Tech Deliverable: Firebase Authentication & Hardened Rules

### What we built

**1. Firebase Authentication**

- Admin/coach sign-in is handled by **Firebase Authentication** (`signin.html` +
  `signin.js`, and the admin sign-in in `admin.html` + `admin.js`), with email/password
  and Google sign-in options.
- The admin dashboard and student app are separate: only authenticated users with the
  correct claim reach the admin tools.
- Passwords are **never** saved in the browser — `assets/js/credentials.js` stores only
  the email address (keyed lowercase) so sign-in forms can pre-fill it, and it actively
  purges legacy plaintext password keys from older builds.
- Admin rights are granted server-side with **custom claims** (`admin: true` for a
  super-admin, or a `schools: [...]` list for school-scoped admins) minted by
  `services/set-claims.js`. Claims can't be self-assigned from the client.

**2. Tightened Firestore Security Rules**

`firestore.rules` now enforces:

| Path | Read | Write |
| --- | --- | --- |
| `schools/{schoolId}/events/{eventId}` | Public | Admin only |
| `schools/{schoolId}/settings/school` | Public | Admin only |
| `schools/{schoolId}/{everything else}` (sports, clubs, teams, statistics) | Admin only | Admin only |
| `schools/{schoolId}` (the school doc) | Admin only | Admin only |
| Anything else | Denied | Denied |

- Authorization is claim-based: `isSuperAdmin()` checks `request.auth.token.admin == true`,
  and `isSchoolAdmin(schoolId)` accepts either the super-admin claim or a matching school
  in the `schools`/`school` claim.
- The rules **fail closed** — a catch-all `match /{document=**} { allow read, write: if false; }`
  denies anything not explicitly permitted.
- Writes are impossible without a valid claim, so ordinary users can read the public
  schedule but can never change it.

### Evidence

| File | Role |
| --- | --- |
| `firestore.rules` | Hardened, claim-based security rules with a fail-closed default |
| `signin.html` + `assets/js/signin.js` | Firebase Authentication sign-in UI |
| `admin.html` + `assets/js/admin.js` | Authenticated admin dashboard |
| `assets/js/credentials.js` | "Remember me" store — email only, passwords never persisted |
| `services/set-claims.js` | Mints `admin` / `school` custom claims (out-of-band) |
| `tests/rules/firestore.rules.test.js` | Automated tests: anonymous can read public events, cannot read admin collections, cannot write |
| `assets/js/firebase-client.js` | Client reads public data; falls back locally if Firestore is unreachable |

### How to verify it

1. Deploy the rules: `firebase deploy --only firestore:rules`
2. Grant an admin claim: `npm run set-admin -- user@example.com --admin`
3. Run the rules tests with the emulator:
   `npx firebase emulators:exec --only firestore "npm run test:rules"`
4. In the app: anonymous visitors can read events; `admin.html` requires sign-in; an
   unauthenticated write is rejected.

> **Screenshots / live URL:** add a screenshot of the Firebase Authentication users
> list, a screenshot of the Firestore Rules tab, and/or the deployed URL.

---

## Part 3 — Submission Package

### Team members
1. William Eaton
2. Logan Cook

### What the team produced this week
- A **risk assessment** identifying 9 project risks with likelihood, impact, and a
  solution/control measure for each (Part 1 above).
- **Firebase Authentication** for coach/admin access plus **hardened, claim-based
  Firestore security rules** that let users read only the public schedule and write
  nothing unless they have an admin claim (Part 2 above).

### Personal contributions

**William Eaton**
> This week I worked on the security side of our app, mainly the Firestore rules so people can only read the public schedule and can't change stuff unless they're an admin. I also helped set up the Firebase Authentication for the admin sign-in and made sure passwords never get saved in the browser. Testing the rules to make sure anonymous users actually get blocked was a little confusing at first but I got it working.

**Logan Cook**
> _Logan will upload his own contribution._

### What didn't work (fill in if applicable)
> _If any part of this week's work got stuck, describe what you tried and where you
> got stuck. Explaining an honest blocker counts toward the grade._
