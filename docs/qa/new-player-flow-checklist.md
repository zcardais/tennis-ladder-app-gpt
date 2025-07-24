# 🧪 ChallengeKing – New Player Flow QA Checklist

> 🎯 Purpose: This checklist verifies the experience from the **player’s point of view**, including any admin-triggered workflows that directly impact the player’s ability to participate.

## Section 1: Account Creation & Club Enrollment
> ℹ️ This section overlaps with the admin checklist. Included here to ensure the player receives and can act on admin-triggered onboarding.

- [ ] Admin has successfully invited the player (test with fresh invite)
- [ ] Player receives welcome email with login instructions
- [ ] Player can log in and access dashboard on first attempt

## Section 2: Ladder Enrollment
> ℹ️ This section overlaps with the admin checklist. Verified here to ensure player onboarding flow is complete.

- [ ] Player is notified when added to a ladder
- [ ] Ladder rules are clear and accessible from dashboard
- [ ] Player sees correct ladder name and their placement

## Section 3: Issuing a Challenge
- [ ] Player can see list of eligible opponents
- [ ] Challenge button only appears next to valid targets
- [ ] Challenge workflow is smooth: select opponent → confirm → notify
- [ ] Opponent is notified via app/email

## Section 4: Responding to a Challenge
- [ ] Player sees new challenge notification clearly in dashboard
- [ ] Player can accept or decline challenge
- [ ] System updates match status when accepted/declined

## Section 5: Match Play & Score Reporting
- [ ] Player can access score submission screen after match
- [ ] Player can submit scores in correct format (e.g., "6-4, 6-2")
- [ ] Rankings/stats update immediately after submission
- [ ] Player sees confirmation and updated ladder standing

---

## ✅ Notes:
- Use this checklist during full user flow QA or UAT
- Pair with `new-admin-flow-checklist.md` for complete test coverage