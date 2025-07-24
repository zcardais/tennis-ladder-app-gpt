# 🧪 ChallengeKing – New Admin Flow QA Checklist

> 🎯 Purpose: This checklist verifies that admins can manage users, configure ladders, handle matches, and enforce rules as expected.

## Section 1: Adding a New Player
> ℹ️ This section overlaps with the player checklist. Verified here from the admin control perspective.

- [ ] Admin can open the “Add Player” screen
- [ ] Required fields (email, first name, last name) are enforced
- [ ] On submission, player is added to the system without errors
- [ ] Player receives welcome/invitation email (verify via test inbox)

## Section 2: Adding Player to a Ladder
> ℹ️ This section overlaps with the player checklist. Focus here is on admin configuration and UI success states.

- [ ] Admin can select a ladder and add a player from dropdown
- [ ] System displays confirmation when player is added
- [ ] Player appears at correct position on the ladder
- [ ] Player receives confirmation or rules via email (if enabled)

## Section 3: Managing Challenges
- [ ] Admin can view list of active/pending challenges
- [ ] Admin can cancel or override a challenge
- [ ] System prevents duplicate challenges to same opponent
- [ ] Challenge rules (limits, cooldowns) are enforced automatically

## Section 4: Reviewing or Editing Match Results
- [ ] Admin can view match history and submitted scores
- [ ] Admin can edit or override a score
- [ ] Changes to score result in real-time ranking updates
- [ ] Override reason is stored or displayed

## Section 5: Ladder Configuration
- [ ] Admin can create a new ladder (name, date, type)
- [ ] Admin can edit challenge rules (format, wildcards, timing)
- [ ] Admin can pause, reopen, or delete ladders
- [ ] UI prevents changes that would corrupt ladder data

## Section 6: Monitoring User Experience
- [ ] Admin can view player dashboards (read-only or impersonation)
- [ ] Admin is notified of challenge timeouts or rule violations
- [ ] Admin dashboard includes health indicators (e.g., active %, pending match count, stale ladders)

---

## ✅ Notes:
- Use this checklist to test admin dashboards and ladder setup flows
- Pair with `new-player-flow-checklist.md` for full flow verification