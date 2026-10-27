# GameDay+ — Week 7: Data, Privacy & Smart Features

**Team Members:** William Eaton, Logan Cook

---

## Part 1 — Business Deliverable: Data & Privacy

### 1. Every piece of user data we collect

GameDay+ was designed to hold as little personal data as possible. Most of what
the app stores is *school* data (games, scores, venues), not *user* data. The
personal data we do handle is listed below.

| # | Data we collect | Who it's about | Why we need it | How it's protected |
| --- | --- | --- | --- | --- |
| D1 | **Email address** (admin/coach) | Staff who sign in | To sign in and to decide who may edit data | Stored locally only for form pre-fill (`assets/js/credentials.js`). Passwords are **never** saved — the code actively deletes any password left by older builds. Account security is handled by Firebase Authentication. |
| D2 | **Account identity (email + Firebase user ID)** | Staff who sign in | Authentication and admin authorization | Managed entirely by Firebase Authentication; we never store passwords. Admin rights are granted with server-minted **custom claims**, never from the browser. |
| D3 | **Push notification token** | Any visitor who opts in | To deliver game-change alerts to that device | Stored in Firestore at `schools/{schoolId}/subscribers/{token}`. Anyone may create/update their *own* token, but **only a school admin can read the list**. The token is a device identifier, not a name or email. |
| D4 | **Browser user-agent string** (truncated to 200 chars) | Push subscribers | To debug why a device isn't receiving pushes | Same `subscribers` doc; readable only by a school admin. Contains no name or contact info. |
| D5 | **UI preferences** (theme, recently-viewed schools) | Everyone | Remember the user's theme and quick school shortcuts | Stored **only in the browser** (localStorage) and never sent to any server. |
| D6 | **School data** (games, scores, venues, sports, clubs) | Not personal — about events | This is the app's actual content | Public schedule is world-readable by design; everything else is admin-only and enforced by `firestore.rules`. |

**What we deliberately do NOT collect:** no full names, no phone numbers, no
home addresses, no birthdates, no location tracking, no analytics, and no
third-party advertising cookies.

### 2. Why we need each item

- **D1/D2 (email, account identity):** the app is zero-login for *students*. Only
  coaches/admins sign in, and they need an account to prove they're allowed to
  change game data.
- **D3/D4 (push token, user-agent):** students opt in with one tap to get alerts.
  We need the device token to send a push, and the user-agent only to diagnose
  failures.
- **D5 (preferences):** pure convenience; a dark-mode choice the user expects to
  persist.

### 3. Plain-English privacy statement

> **GameDay+ Privacy Statement (plain English)**
>
> GameDay+ is a school sports schedule. Students do **not** need an account and we
> do not ask for your name, phone number, or address.
>
> **We store three things:**
> 1. If you turn on game alerts, we save a **device token** so we can send you a
>    notification when a game changes. You can turn this off any time.
> 2. If you're a coach and you sign in, we know your **email address** so we can
>    check that you're allowed to edit the schedule. We never store your password.
> 3. Your **theme choice** (like dark mode) is saved **on your own device only**.
>
> **We do not sell your data, we do not show ads, and we do not track you across
> other sites.** The game schedule itself is public — that's the whole point of the
> app.
>
> **Your control:** turning off notifications deletes your device's link to us.
> If you have questions, contact the school's athletics office.

### 4. Where AI output could be wrong — and what we do about it

Our new AI feature (below) drafts an event **description** using a large
language model API. Because AI can be confidently wrong, we treat its output as
a **draft, never a fact**:

| Risk | What could go wrong | Our control |
| --- | --- | --- |
| **Hallucination** | The model invents a score, record, or player that isn't real | The prompt instructs it to use **only the facts provided** and to avoid guessing. The draft lands in an editable text box, and we label it *"AI draft added — review before saving."* |
| **Wrong tone / inappropriate text** | Odd or off-message wording on a school site | The prompt fixes the tone ("short, friendly, factual") and generates **2–3 sentences** only. A human admin reviews and edits before anything is saved. |
| **Missing context** | Thin input produces a vague blurb | The prompt tells the model to stay **general instead of guessing** when facts are missing. |
| **Bias / unfair phrasing** | A description that favors or disparages a team | Descriptions are admin-reviewed; the prompt forbids inventing claims about teams. |

**Rule of thumb we adopted:** AI drafts, humans decide. No AI-generated text is
published to students without an admin glancing at it, and the AI can only *write
a description* — it can never edit, delete, or publish data on its own.

---

## Part 2 — Tech Deliverable: AI-Powered Description Generator

### What we built

We added an **AI-powered feature** that drafts event descriptions for the admin.
An admin fills in an event (sport, opponent, date, venue, etc.) and clicks
**"Generate with AI"** to have a large language model write a short,
student-friendly description for that event.

**A note on the AI provider:** the assignment suggested the **Gemini API**. Our
school's Google Workspace account is **blocked from Google AI Studio**
(visiting it redirects to a Google "ServiceNotAllowed" page), so we could not
create a Gemini key, and a personal Google account isn't an option for us. We
therefore used an **OpenAI-compatible LLM API** instead — **Groq** as the
default, with **OpenRouter** as a fallback. The architecture and prompt are
provider-agnostic, so switching providers is a one-line config change.

**How it works, end to end:**

1. In `admin.html`, the **Add/Edit event** form now has a **"Generate with AI"**
   button next to the Description field.
2. Clicking it sends the event's fields to a small local service
   (`services/generate-description.js`) that runs on `http://localhost:8787`.
3. That service builds a careful prompt (facts only, no inventing) and calls the
   **Groq API** (or OpenRouter) server-side.
4. The model returns a 2–3 sentence draft, which the browser loads into the
   Description box for the admin to review and edit.
5. If the service isn't running or no key is configured, the button degrades
   gracefully with a clear, helpful message instead of crashing.

**Why a separate service?** The API key is a secret. Putting it in the browser's
JavaScript would expose it to anyone who views the page. We keep the key
**server-side only** — the exact same security boundary we already use for
Firebase Cloud Messaging push (the FCM private key never ships to the browser
either).

### The AI prompt (accuracy by design)

The service sends the model a tightly-scoped prompt:

```
You write short, friendly, factual event blurbs for a high-school sports app.
Write ONE description of 2 to 3 sentences (max 45 words).
Use only the facts provided. Do not invent scores, records, or names.
If key facts are missing, keep it general instead of guessing.
No emojis, no quotes, no markdown - just the sentence(s).

Event facts:
Event: Varsity Football vs Panthers
Sport: Football
Opponent: Snake River
Date: 2026-10-24
Home/Away: Home
```

This keeps the output short, on-tone, and grounded in real data — addressing the
"AI can be wrong" concerns from Part 1 directly in the prompt.

### Evidence

| File | Role |
| --- | --- |
| `services/generate-description.js` | Local HTTP service that calls the AI provider with the key held server-side |
| `assets/js/ai.js` | Browser client — sends event fields to the service and returns the draft |
| `assets/js/admin.js` | Event form: the **"Generate with AI"** button and its handler |
| `admin.html` | Loads `ai.js` before `admin.js` |
| `.env.example` | `GAMEDAY_AI_PROVIDER`, `GROQ_API_KEY`, `OPENROUTER_API_KEY` settings |
| `package.json` | `npm run ai:describe` script |
| `tests/unit/ai-description.test.js` | Unit tests for the prompt builder and provider resolution |

### How to verify it

1. Get a free Groq API key at https://console.groq.com/keys (no credit card) and
   put it in `.env` as `GROQ_API_KEY=...`.
2. Start the service: `node services/generate-description.js` (or `npm run ai:describe`).
3. Open `admin.html`, sign in, click **Add event**, fill in a few fields.
4. Click **Generate with AI** — a description draft appears in the box.
5. Review/edit it, then save the event as normal.

> **Degrades safely:** without a key or with the service stopped, the button
> shows *"Add your AI provider key to .env"* or *"AI service is not running"* —
> the admin app keeps working normally.

> **Screenshots / live URL:** add a screenshot of the "Generate with AI" button,
> the draft it produced, and/or the `ai-description` unit tests passing.

---

## Part 3 — Submission Package

### Team members
1. William Eaton
2. Logan Cook

### What the team produced this week
- A **data & privacy review** listing every piece of user data we collect, why we
  need it, and how it's protected, plus a **plain-English privacy statement** and
  an honest assessment of where AI output can be wrong (Part 1 above).
- An **AI-powered feature** — an admin-side "Generate with AI" button that drafts
  an event description. The assignment suggested the Gemini API; because our
  school Google account is blocked from Google AI Studio, we used an
  **OpenAI-compatible provider (Groq)** instead, with the API key kept safely
  server-side (Part 2 above).

### Personal contributions

**William Eaton**
> This week I added the AI feature to our app. The assignment said to use the
> Gemini API, but our school Google account is blocked from Google AI Studio, so
> we couldn't get a Gemini key - we switched to an OpenAI-compatible provider
> (Groq) instead. I built a small helper that talks to the AI on the server so
> our key never ends up in the browser, and I added a "Generate with AI" button
> to the admin event form that writes a description for the game. I also wrote
> out the list of what user data we actually collect and how it's protected. The
> tricky part was making sure the AI only uses the real game info and doesn't
> make stuff up, so I wrote the prompt to say that directly.

**Logan Cook**
> _Logan will upload his own contribution._

### What didn't work (fill in if applicable)

> We hit a real blocker trying to follow the assignment's suggested AI. Our
> school's Google Workspace account is blocked from **Google AI Studio** —
> opening it just redirects to a Google "ServiceNotAllowed" page ("your account
> is managed by an organization that has this service turned off"), so we could
> not create a Gemini API key, and a personal Google account isn't an option for
> us. We confirmed the Gemini *API endpoint* itself still works, but without a
> key it was useless to us. So we pivoted to an **OpenAI-compatible provider
> (Groq, free, no credit card)** behind the exact same server-side key design,
> which fixed it. We also originally wanted the AI to run automatically inside
> the app like a Cloud Function would, but that needs a paid Firebase plan we
> don't have, so for now the admin starts the small AI service themselves — the
> same way we already run the push-notification sender.
