# ✅ Tennis Ladder App – Updated Task List (July 2025)

---

- [x] Link current user to `auth.currentUser.uid` throughout app
- [ ] Auto-send ladder rules to player upon being added to ladder
- [ ] Create “Resend Invite” button in Admin tools
- [ ] Add final Firestore security rules before release
- [ ] Confirm challenge flow works across 2+ real accounts
- [ ] Implement “Forgot Password” recovery screen
- [ ] Test on iPad and desktop screen widths

- [x] Add "Recent Matches" module to Dashboard (show last 3–5 matches, link to full match history)
- [x] Wire up View All Matches button on dashboard.html
- [x] Wire up profile.html so that it shows my profile information using uid
- [ ] Wire up all user pages to show user-specific data e.g. stats, profile, ladders…
  - [x] stats.html
  - [x] profile.html
  - [ ] ladder.html


---

## ⚙️ Medium Priority
- [x] Update Challenge cards to show challenger's name instead of uid
- [x] Improve W–L display in player cards (styled badge or “3–2” shorthand)
- [ ] Add challenge expiration countdown or status indicator
- [ ] Wildcard challenge system (admin config per ladder)
- [ ] Challenge acceptance window with auto-decline after X days
- [ ] Configurable ladder open and close dates
- [ ] Inactivity penalty system (e.g., drop X spots after Y days)
- [ ] Finalize admin rule config UI for:
  - challenge range
  - forfeit window
  - challenge-down toggle
- [ ] Add team color to ladder cards (optional field)
- [ ] Auto-scroll to top of dashboard after login redirect

- [ ] Define ranking logic for new players joining a ladder (default, manual, or dynamic)

---

## 🎨 Low Priority
- [ ] Add visual spacing or dividers between sections on dashboard
- [ ] Add “My Active Challenges” tab (sent and received)
- [ ] Add favicon and app title to match brand
- [ ] Convert toast logic to a reusable module
- [x] Polish loading states on slower network
- [ ] Admin dashboard with ladder health stats (active %, pending challenges, stale matches)
- [ ] Admin impersonation or “view as player” mode for support/debug

## Cleanup Tasks
- [ ] Confirm if `matches.html` and `matches.js` are still needed
- [ ] Remove all `mockRecord` references
- [ ] Review and optionally archive `seed-test-data.cjs` and `reset-test-data.cjs`
- [ ] Review `test-firestore.js` and remove or archive if redundant
- [ ] Delete unused `/js/` folder in root (keep `/src/js/`)
- [ ] Delete `index.html` if it only redirects to `dashboard.html`. Get help from chatGPT to verify `firebase.json` or `vite.config.mjs` to make sure routing still works post-deletion.

## Phase II
- [ ] Support doubles ladder structure (team creation, pairing logic) *(phase 2 – plan schema now)*

## 🏛️ Clubs Integration (Planned)

- [ ] Create a `clubs` collection (fields: `name`, `createdAt`, `createdByUid`, `adminUids`)
- [ ] Add `clubId` to `players` documents on creation/invite
- [ ] Add `clubId` to `ladders` when created
- [ ] Restrict all queries (ladders, players, matches) to current user's `clubId`
- [ ] Update dashboard to only show ladders for user's club
- [ ] Update “Invite Player” flow to assign player to inviter’s `clubId`
- [ ] Build "Create Club" admin flow (set `name`, store admin as creator)
- [ ] Update Firestore security rules to enforce `clubId` scoping
- [ ] (Optional) Add club-level branding settings (color, logo, tagline)
- [ ] (Optional) Create `club.html` admin panel to manage players, ladders, and branding

---

## ✅ Completed
- [x] Integrate real user authentication (Firebase Auth)
- [x] Prevent duplicate open challenges between players
- [x] Add toast notifications on challenge/report
- [x] Simulated login and consistent test accounts
- [x] Match lifecycle (issue → accept → report)
- [x] Admin: Create/Edit ladders + manage players
- [x] Ladder rankings + bump logic
- [x] Responsive layout + mobile-first design

- [x] Link current user to `auth.currentUser.uid` throughout app
- [x] Update Challenge cards to show challenger's name instead of uid
- [x] Fetch and display actual W–L records in each dashboard ladder card (replace mockRecord)
- [x] Improve record (W–L) rendering in player cards
- [x] Display actual win/loss record on ladder.html top card
- [x] Show player initials and name correctly throughout app

--- --- --- --- --- ---

# ✅ Tennis Ladder App – QA + Wiring Checklist (June 2025)

## 🔁 General App Flow
- [ ] Use consistent `loggedInPlayerId` (simulate login)
- [x] Ensure all pages load `main.js` and their page-specific JS
- [ ] Validate all URL parameters are passed consistently (e.g., `ladderId`, `opponent`)

---

## 🏠 Dashboard (`dashboard.html`)
- [x] Render joined ladders for current player
- [x] Display ladder name, dates, and buttons
  - [x] View Ladder
  - [x] Issue Challenge
- [x] Ladder buttons pass correct `ladderId` via URL

- [x] Fetch and display actual W–L records in each dashboard ladder card (replace mockRecord)

---

## 📈 Ladder Page (`ladder.html`)
- [x] Load ladder details from Firestore
- [x] Show ranked participants with full names
- [x] Display “Issue Challenge” buttons (except self)
- [x] Instantly create `challenges` doc on button click
- [x] Prevent issuing a challenge if one is already pending
- [x] Display actual win/loss record on ladder.html top card
- [x] Show player initials and name correctly throughout app

---

## 🎾 Create Challenge Page (`create-challenge.html`)
- [x] Parse `ladderId` from URL
- [x] Load list of opponents as selectable cards
- [x] Submit challenge to Firestore on click
- [x] Show confirmation and auto-dismiss message

---

## 📬 Challenges Page (`challenges.html`)
- [x] Display all incoming pending challenges
- [x] Include challenger name and issued date
- [x] Allow Accept / Deny actions
- [x] Update challenge status in Firestore
- [x] Refresh view after update

---

## 🧪 QA Validation Steps
- [x] Challenge a player, switch users, and view incoming challenge
- [x] Accept the challenge → confirm Firestore update
- [x] Deny a challenge → confirm it disappears
- [x] Prevent duplicate open challenges to same player
- [x] Validate challenge state transitions across all pages

---

## 🧹 Polish Ideas
- [x] Replace alert() with toast notifications
- [x] Add loading states or spinners
- [x] Improve record (W–L) rendering in player cards
- [ ] Add page for viewing all my active challenges
- [ ] Polish stats.html page to match mockup
  - [ ] stats page URL needs to grab player ID or user UID

- [ ] Hook up real match-data charts on stats.html and verify mobile responsiveness
- [ ] Replace remaining alert() calls with toast notifications and add loading spinners for all data loads
- [ ] Review Firestore security rules to ensure ladders, matches, and challenges are scoped to each user’s UID
- [ ] Perform end-to-end responsiveness QA on phone and tablet breakpoints
- [ ] Decide whether or not to keep matches.html and matches.js. They may be redundant given that we're pulling W-L record and stats.html data from the challenges collection
