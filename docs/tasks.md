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

---

## 📈 Ladder Page (`ladder.html`)
- [x] Load ladder details from Firestore
- [x] Show ranked participants with full names
- [x] Display “Issue Challenge” buttons (except self)
- [x] Instantly create `challenges` doc on button click
- [ ] Prevent issuing a challenge if one is already pending

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
- [ ] Prevent duplicate open challenges to same player
- [x] Validate challenge state transitions across all pages

---

## 🧹 Polish Ideas
- [x] Replace alert() with toast notifications
- [x] Add loading states or spinners
- [ ] Improve record (W–L) rendering in player cards
- [ ] Add page for viewing all my active challenges