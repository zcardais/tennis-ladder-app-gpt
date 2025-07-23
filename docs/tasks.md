# ✅ Tennis Ladder App – QA + Wiring Checklist

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
- [ ] Improve record (W–L) rendering in player cards
- [ ] Add page for viewing all my active challenges
- [ ] Polish stats.html page to match mockup
  - [ ] stats page URL needs to grab player ID or user UID

- [ ] Hook up real match-data charts on stats.html and verify mobile responsiveness
- [ ] Replace remaining alert() calls with toast notifications and add loading spinners for all data loads
- [ ] Review Firestore security rules to ensure ladders, matches, and challenges are scoped to each user’s UID
- [ ] Perform end-to-end responsiveness QA on phone and tablet breakpoints
- [ ] Decide whether or not to keep matches.html and matches.js. They may be redundant given that we're pulling W-L record and stats.html data from the challenges collection