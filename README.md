# GameDay+ Sports & Events Web App

**GameDay+** is a zero-login high school sports and events hub built for students, parents, coaches, and booster clubs. It solves the problem of high schoolers never knowing when and where upcoming games are happening, how to get to away games, and what the latest scores/stats are.

---

## 🌟 Key Features

1. **Zero-Login Quick Access**: Open the web app on any smartphone, tablet, or laptop and instantly see all upcoming games, scores, and venue details without passwords or signups.
2. **3-Way Theme Switcher**:
   - 🛡️ **School Spirit Mode**: Classic Varsity Navy & Gold palette with animated glassmorphism cards.
   - 🌙 **Dark Mode (OLED)**: High contrast modern dark aesthetic.
   - ☀️ **Light Mode**: Crisp, clean daylight theme.
3. **Sports Filter Bar**:
   - Filter instantly between **All Events, Football, Basketball, Soccer, Baseball/Softball, Volleyball, Track & Field, and Cheer & Clubs**.
   - Time window filters for **All, Upcoming, Today, and Past Results**.
   - One-touch toggle for **Away Games Only**.
4. **Away Game Directions & Interactive Stadium Map**:
   - Interactive **OpenStreetMap / Leaflet** map showing all Home & Away venues.
   - Distance and ETA calculation from school to away stadiums.
   - 1-Click Turn-by-Turn GPS routing for **Google Maps**, **Apple Maps**, and **Waze**.
   - Parking tips, gate opening times, and entrance notes.
5. **Interactive Schedule & Calendar**:
   - Monthly and weekly grid views with sport color-coded badges.
   - Select any date to inspect full event details.
   - 1-Click **"Add to Google Calendar"** and **.ics** event exports.
6. **Game Statistics & Box Scores**:
   - Period-by-period scoring breakdown (Q1–Q4, Innings, Halves).
   - Star Player of the Game spotlight with stats.
   - Season records, conference standings, average points, and winning streaks.
7. **Firestore-backed administration**:
   - Authorized administrators can manage events, sports, clubs, teams, statistics, and school settings from `admin.html`.
   - The public app reads school-scoped data directly from Firestore and keeps a local fallback dataset for development.

---

## 🚀 How to Run Locally

You can run GameDay+ directly in any web browser!

### Option 1: Live Local Dev Server
```bash
# Using Python
python -m http.server 3000

# Or using Node.js / npx serve
npx serve .
```
Then open `http://localhost:3000` in your web browser.

### Option 2: Direct File Open
Simply double-click `index.html` in your file explorer to launch the app directly.

---

## 🔐 Firebase setup

1. Create a Firebase project and enable Email/Password Authentication and Cloud Firestore.
2. Copy the web app configuration into `firebase-config.js`. These values identify the Firebase project and are expected to be public in browser applications.
3. Deploy `firestore.rules`. Administrator accounts must have the Firebase Authentication custom claim `admin: true`; the rules reject all writes without it.
4. Open `admin.html` to sign in and manage the school identified by the `school` query parameter, such as `admin.html?school=sugar-salem`.

### Deploy with Firebase Hosting

From the project directory, authenticate and select your Firebase project:

```bash
npx firebase-tools login
npx firebase-tools use --add
npx firebase-tools deploy --only hosting,firestore:rules
```

After selecting the project, copy its web app configuration into `firebase-config.js` before opening the deployed site. The deployed admin page is available at `/admin.html?school=sugar-salem`.

The Firestore layout is `schools/{schoolId}/events`, `sports`, `clubs`, `teams`, `statistics`, and `settings/school`. Public reads are allowed; writes require the administrator claim.

## 📊 Legacy Google Sheet import

To connect your school's live schedule:

1. Create a Google Sheet with the following header row:
   ```csv
   Sport,Opponent,Date,Time,Location,Venue Name,Venue Address,Our Score,Opp Score,Status,Highlights,Latitude,Longitude
   ```
2. In Google Sheets, click **File &rarr; Share &rarr; Publish to web**.
3. Select **Entire Document** and choose **Comma-separated values (.csv)**.
4. Click **Publish** and copy the published URL.
5. Open the GameDay+ app, click **Sheet Sync** in the top navigation, paste your URL, and click **Sync Live Sheet Now**.

---

## 📱 Mobile Friendly & Offline Ready

GameDay+ is designed mobile-first. It includes responsive touch targets, smooth swipe navigation, and caches your schedules in LocalStorage so students can check the game schedule even when signal is weak.
