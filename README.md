# 🎾 ChallengeKing – Tennis Ladder App

This is a mobile-first web application for managing singles and doubles tennis ladder competitions. It includes admin tools, automated ladder rules, and a player-first experience inspired by platforms like TennisRungs.

---

## 🚀 Project Overview

- Built with Firebase, vanilla JS, and responsive HTML/CSS
- Includes admin and player dashboards
- Supports challenge creation, match reporting, rankings, and ladder config
- Targeted for MVP usability with competitive parity features

---

## 🛠️ Development Workflow

1. Prioritized task list lives in `tasks.md`
2. Work through 🔥 High Priority features first, then ⚙️ Medium and 🎨 Low
3. After each major task group, use QA checklists (`/docs/qa/`) to test key flows:
   - `new-player-flow-checklist.md`
   - `new-admin-flow-checklist.md`
4. Use feature toggles or stubs for unfinished parts if needed

---

## 🧪 QA Strategy

- Use side-by-side PDF (`player-vs-admin-flow.pdf`) or markdown checklists
- Run targeted QA after each milestone, not just at the end
- Log bugs or edge cases in `qa-log.md` (optional)
- Final pass before sharing with outside testers

---

## 🔖 File Reference

- `tasks.md` — Master task list with priorities
- `docs/qa/` — QA checklists for player/admin flows
- `player-vs-admin-flow.pdf` — Side-by-side view of user journeys

---

## 🧍‍♂️ Audience

This repo is for personal use and development. Once core flows are solid, I may invite 2–3 friends for private testing.

# Scripts

This folder contains one-time or utility scripts for managing Firestore data.

## Scripts Included

### `backfill-player-ladders.js`
Adds a `ladders` array to each player document based on the ladder’s `participants[]`.

### `remove-ladderId-from-players.js`
Removes the obsolete `ladderId` field from player documents now that we support multi-ladder participation.

## Usage

Run any script from the project root:
```bash
node scripts/script-name.js
```