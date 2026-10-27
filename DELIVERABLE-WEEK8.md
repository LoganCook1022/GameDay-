# GameDay+ — Week 8: Cost Analysis

**Team Members:** William Eaton, Logan Cook

---

## Part 1 — Business Deliverable: Cost Estimate

This estimate covers what GameDay+ would cost to build and run as a real product.
Numbers are educated estimates for a small high-school athletics app; reasoning is
shown for each line so the totals can be adjusted.

### 1. Development Costs

Development is quoted at a realistic junior-to-mid developer market rate for a
student/entry-level build, plus a PM allowance. The project is scoped at roughly
the effort already spent (see the Week 5 timeline: ~14 weeks of part-time work,
which is about 12 full-time-equivalent weeks for two people).

| Role | People | Rate | Duration (FTE) | Cost |
| --- | --- | --- | --- | --- |
| Frontend / app developer | 2 | $35 / hr ($1,400 / wk) | 12 weeks each (24 wk total) | $33,600 |
| Project management / coordination | 1 (20% time) | $45 / hr | 12 weeks | $8,640 |
| **Development subtotal** | | | | **$42,240** |

*Reasoning:* Two student developers working part-time across a semester. At
$35/hr and ~40 hrs a week each, 12 FTE weeks is $33,600. PM is a 20%-time
allowance on top. This is the single largest cost and the one most sensitive to
scope creep.

### 2. Technology Costs

| Item | Annual / Monthly | Cost |
| --- | --- | --- |
| Domain name (e.g. gamedayplus.org) | $12 / yr | $12 |
| Firebase Hosting | Free tier (10 GB storage, 360 MB/day transfer) | $0 |
| Cloud Firestore (reads/writes/storage) | Free tier (50k reads, 20k writes, 1 GB/day) | $0 |
| Firebase Authentication | Free (email/password + Google) | $0 |
| Firebase Cloud Messaging (web push) | Free, unlimited | $0 |
| Google Maps / OpenStreetMap (Leaflet) | OpenStreetMap is free; Google Maps would be usage-based | $0 |
| SSL/HTTPS | Included with Firebase Hosting | $0 |
| **Technology subtotal** | | **$12 / yr** |

*Reasoning:* The whole stack was chosen to sit inside Firebase's free ("Spark")
tier. A single high school's traffic is tiny — a few thousand reads a day at most —
so Firestore and Hosting stay free. The only hard cost is the domain. If the app
were rolled out to many schools, Firestore would move to the Blaze plan and cost
roughly $0.06 per 100k reads, but at this scale it stays $0.

### 3. Overhead & Marketing

| Item | Basis | Cost |
| --- | --- | --- |
| Marketing (flyers, QR codes, social posts) | Printed flyers + posters at games | $150 |
| Tooling (GitHub, VS Code, Firebase CLI) | Free tiers | $0 |
| Contingency buffer (15% of development) | Unplanned fixes, rework | $6,336 |
| **Overhead & marketing subtotal** | | **$6,486** |

*Reasoning:* Marketing for a single school is mostly word-of-mouth and printed
QR-code flyers at games, which is cheap. A 15% contingency is standard practice
for a first version and covers bugs found during testing (see the Week 6 risk
assessment, R6 schedule slip).

### Total Estimated Cost

| Category | Cost |
| --- | --- |
| Development | $42,240 |
| Technology (first year) | $12 |
| Overhead & marketing | $6,486 |
| **Grand total (Year 1)** | **$48,738** |

**Ongoing cost after Year 1:** ~$12/year for the domain (all app infrastructure
stays free at this scale), plus ~$0 for maintenance if no further development is
done. Any future feature work would be billed at the same developer rate.

### Notes & Assumptions

- Rates are junior/entry-level averages for the region; a professional agency
  would roughly triple the development line.
- Assumes the team's own computers and free software (no hardware purchase).
- Assumes a single school. Each additional school adds no technology cost (same
  Firebase project) but increases support/marketing effort.
- Firestore pricing only begins once the free daily quota is exceeded, which a
  single school would not reach.

---

## Part 2 — Tech Deliverable: Firebase Cloud Messaging (Web Push)

### What we built

We added **Firebase Cloud Messaging (FCM) web push** so students get notified
when a game changes — a new capability and a new Firebase service added to the
project this week.

**How it works, end to end:**

1. A **bell button** in the app header lets any visitor opt in with one tap —
   still zero-login.
2. Tapping it requests browser notification permission, registers the FCM service
   worker (`firebase-messaging-sw.js`), and gets a device token.
3. The token is stored in Firestore at
   `schools/{schoolId}/subscribers/{token}` so the admin sender can reach every
   interested device for that school.
4. An admin composes an alert from the admin dashboard's **Notifications** tab.
   It is queued to Firestore (`schools/{schoolId}/notification_queue`), then the
   sender delivers it: a one-time drain (`node services/send-notifications.js
   --drain`) or a background watcher (`node services/notify-watcher.js`) that
   auto-sends every queued alert. Dead tokens are automatically deactivated.
5. Delivery is handled in both states: background pushes by the service worker,
   and foreground pushes (page open) by an in-page handler that shows a real
   notification plus a toast. Clicking a notification focuses or opens the app
   at the right school.

### Security

The new `subscribers` collection is **write-only for the public**: visitors may
create/update their own token (with validation that the school matches the path),
but **no one can read the roster except a school admin**. This was added to
`firestore.rules` and covered by new automated rules tests.

### Evidence

| File | Role |
| --- | --- |
| `firebase-messaging-sw.js` | FCM service worker — handles background push + notification clicks |
| `assets/js/notifications.js` | Client module: permission, token registration, opt-in/out, bell state, foreground push handler |
| `services/send-notifications.js` | Admin sender — fans out a push to a school's subscribers (chunked, prunes dead tokens) |
| `services/notify-watcher.js` | Queue watcher — polls the queue and auto-delivers queued alerts on a timer |
| `assets/js/admin.js` | Admin dashboard **Notifications** tab — compose/queue/cancel alerts, sent history |
| `firestore.rules` | New `subscribers` rule: public create/update, admin-only read |
| `index.html` + `assets/js/app.js` | Bell button in the header, `initPushButton()` wiring |
| `assets/js/firebase-config.js` | Web Push (VAPID) public key slot |
| `tests/rules/firestore.rules.test.js` | Tests: public can subscribe, cannot read the roster, cross-school subscribe blocked |
| `package.json` | `npm run notify`, `notify:drain`, and `notify:watch` scripts |

### How to verify it

Setup (already done in the live deployment):

1. In the Firebase Console, add a Web Push certificate and paste the public key
   into `assets/js/firebase-config.js` (`GAMEDAY_FCM_VAPID_KEY`).
2. Deploy rules: `firebase deploy --only firestore:rules`

Prove delivery:

3. Open the live app, tap the bell, and allow notifications — a token appears
   under `schools/{schoolId}/subscribers` in Firestore.
4. In `admin.html` → **Notifications**, compose an alert and queue it.
5. Deliver it from a machine that holds the service-account key (server-side
   only — the key is never shipped to the browser):
   `node services/send-notifications.js --drain --school sugar-salem --sa "path\to\serviceAccountKey.json"`
   (or start `node services/notify-watcher.js` once and leave it running to
   auto-send every queued alert).
6. The notification appears on the subscribed device (background or foreground)
   and clicking it opens the app at the right school.

> **Note:** the final delivery step requires the Firebase service-account key and
> therefore runs server-side/operator-side, not from the browser. This is a
> deliberate security boundary: FCM server credentials are never exposed to the
> client.

> **Screenshots / live URL:** add a screenshot of the bell button, the browser
> permission prompt, a delivered notification, and/or the Firestore `subscribers`
> collection.

---

## Part 3 — Submission Package

### Team members
1. William Eaton
2. Logan Cook

### What the team produced this week
- A **cost estimate** covering development, technology, overhead, and marketing,
  with reasoning and a grand total of **$48,738 for Year 1** (Part 1 above).
- **Firebase Cloud Messaging web push** — a new Firebase service that lets
  students opt in for game-change alerts, backed by a new secured `subscribers`
  collection (Part 2 above).

### Personal contributions

**William Eaton**
> This week I added push notifications to our app using Firebase Cloud Messaging so students can actually get alerted when a game changes. I built the bell button and the part that asks for permission and saves the device token to Firestore, plus the service worker that shows the notification. The security rules part was tricky because I had to let anyone subscribe but still stop people from reading everyone else's tokens, but I got it working and tested it.

**Logan Cook**
> _Logan will upload his own contribution._

### What didn't work (fill in if applicable)
> _If any part of this week's work got stuck, describe what you tried and where you
> got stuck. Explaining an honest blocker counts toward the grade._
