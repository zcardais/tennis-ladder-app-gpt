# ✅ Tennis Ladder App – QA + Wiring Checklist

## 🔁 General App Flow
- [ ] Use consistent `loggedInPlayerId` (simulate login)
- [ ] Ensure all pages load `main.js` and their page-specific JS
- [ ] Validate all URL parameters are passed consistently (e.g., `ladderId`, `opponent`)

---

## 🏠 Dashboard (`dashboard.html`)
- [ ] Render joined ladders for current player
- [ ] Display ladder name, dates, and buttons
  - [ ] View Ladder
  - [ ] Issue Challenge
- [ ] Ladder buttons pass correct `ladderId` via URL

---

## 📈 Ladder Page (`ladder.html`)
- [ ] Load ladder details from Firestore
- [ ] Show ranked participants with full names
- [ ] Display “Issue Challenge” buttons (except self)
- [ ] Instantly create `challenges` doc on button click
- [ ] Prevent issuing a challenge if one is already pending

---

## 🎾 Create Challenge Page (`create-challenge.html`)
- [ ] Parse `ladderId` from URL
- [ ] Load list of opponents as selectable cards
- [ ] Submit challenge to Firestore on click
- [ ] Show confirmation and auto-dismiss message

---

## 📬 Challenges Page (`challenges.html`)
- [ ] Display all incoming pending challenges
- [ ] Include challenger name and issued date
- [ ] Allow Accept / Deny actions
- [ ] Update challenge status in Firestore
- [ ] Refresh view after update

---

## 🧪 QA Validation Steps
- [ ] Challenge a player, switch users, and view incoming challenge
- [ ] Accept the challenge → confirm Firestore update
- [ ] Deny a challenge → confirm it disappears
- [ ] Prevent duplicate open challenges to same player
- [ ] Validate challenge state transitions across all pages

---

## 🧹 Polish Ideas
- [ ] Replace alert() with toast notifications
- [ ] Add loading states or spinners
- [ ] Improve record (W–L) rendering in player cards
- [ ] Add page for viewing all my active challenges