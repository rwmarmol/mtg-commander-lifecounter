# Roadmap

Each step takes about 5-10 minutes and gets one session and one commit. "AC" refers to the acceptance
criteria in `SPEC.md`. The total is about 105 min. Steps 0-10 make a complete app without art, and
steps 11-12 come after the cut line.

## Decisions on spec ambiguities (defaults; change only with the user's OK)
1. **Game log:** state keeps a minimal `log` array, appended on life and damage changes, persisted and
   tested. There is **no log UI** (that's out of scope).
2. **Branch:** rename `master` → `main` (AC: "CI green on main").
3. **Elimination** is derived from life and damage, never stored. An eliminated panel is dimmed and its
   controls and "Commander damage" button are disabled; only "Revive" (life ≥ 1, lethal damage lowered
   to 20) is active. No undo.
4. **Bounds:** life has no cap and can go below 0. Damage per pair is ≥ 0, and "-" at 0 is a no-op
   (no life given back).
5. **Damage mode:** one receiving panel at a time. This is UI state and isn't persisted. Damage *from*
   eliminated opponents can still be adjusted.
6. **Scryfall:** look up via `/cards/named?fuzzy=` on blur and on Start. Results are cached in memory by
   normalized name. The resolved name and art URL are stored in the persisted match. A failure or
   ambiguous result falls back to the player's color. No API key or `.env` is needed.
7. **Players:** there is no setup screen. The app opens on the match grid with "Player N" names and a
   distinct preset color each; a tap on a panel's name edits name, commander and color. Blank names
   default to "Player N". "New game" keeps the players and resets the counters.
8. **Tests:** reducer, storage and Scryfall only. No RTL or jsdom. The UI is checked by hand.

---

- [x] **0. Bootstrap docs** (10 min)
  - Goal: agree on the plan before any code.
  - Deliverable: `CLAUDE.md`, `README.md`, `ROADMAP.md`.
  - Done: the user has approved all three files.
  - Commit: `docs: bootstrap CLAUDE.md, README and roadmap`

- [x] **1. Scaffold** (10 min)
  - Goal: an empty app that runs and passes checks locally.
  - Deliverable: Vite react-ts with `strict`, ESLint, Vitest, npm scripts `dev/lint/typecheck/test/build`,
    and one smoke test. Deps are approved by the user first.
  - Done: `lint`, `typecheck`, `test` and `build` all pass locally. CLAUDE.md commands are filled in and
    README "How to run" is updated.
  - Commit: `chore: scaffold vite react-ts app with vitest and eslint`

- [x] **2. CI + deploy** (10 min)
  - Goal: a green pipeline and a live URL before any features.
  - Deliverable: GitHub Actions workflow (lint, typecheck, test, build on push/PR) and a Pages deploy job
    from `main`, plus Vite `base` set to the repo name. Branch renamed to `main`. The user creates the
    repo and sets Pages source to "GitHub Actions".
  - Done: CI is green on `main` and the placeholder page is live on Pages (part of AC: CI green, live on
    Pages).
  - Commit: `ci: add github actions for checks and pages deploy`

- [x] **3. Reducer core** (10 min)
  - Goal: a pure match model with life changes.
  - Deliverable: `src/game/` with types, `createMatch(setup)`, reducer actions for life ±1, log entries,
    and tests.
  - Done: tests prove 4 players start at 40 life with 0 commander damage (AC 1), and that ±1 changes only
    the intended player and appends a log entry (AC 2).
  - Commit: `feat(game): add pure match reducer with life changes`

- [x] **4. Commander damage + elimination** (10 min)
  - Goal: full game rules in the reducer.
  - Deliverable: damage ±1 per (source → target) that moves the target's life by the same amount,
    selectors for eliminated players and the winner, and tests.
  - Done: tests show damage adjusts the receiver's life (AC 3), 21 damage from one source or life ≤ 0
    eliminates a player (AC 4), and the last player standing is the winner (AC 5, logic side). Eliminated
    players ignore actions.
  - Commit: `feat(game): add commander damage, elimination and winner`

- [x] **5. Persistence** (10 min)
  - Goal: a reload restores the match.
  - Deliverable: `src/storage/` with a `MatchStorage` interface, a localStorage adapter, a versioned Zod
    schema, and `load/save/clear`. Invalid data or a version mismatch gives `null`. Tests included.
    Adds `zod` with the user's OK.
  - Done: tests round-trip the exact state and reject corrupt data, and `clear` empties storage
    (AC 9, logic side).
  - Commit: `feat(storage): persist match in localStorage with zod validation`

- [x] **6. Setup screen** (10 min) _(later replaced by in-panel editing, see decision 7)_
  - Goal: start a match from the UI.
  - Deliverable: four rows, each with a name, commander (free text) and a color from the preset palette.
    "Start" creates the match and saves it.
  - Done: starting a match by hand shows 4 players at 40. A reload goes straight back to the match.
  - Commit: `feat(ui): add setup screen`

- [x] **7. Match screen** (10 min)
  - Goal: a table-ready layout.
  - Deliverable: 2×2 landscape grid with the top row rotated 180°. Left and right half-panel tap zones
    give -1 and +1. Each panel shows a big life total and a one-line name and commander. Eliminated
    panels are dimmed and locked.
  - Done: checked by hand that the top row reads upright from across the table (AC 6) and that "+" is on
    the reader's right on every panel.
  - Commit: `feat(ui): add match screen with rotated panels`

- [x] **8. Commander damage mode** (10 min)
  - Goal: track commander damage from the UI.
  - Deliverable: a "Commander damage" button on each panel. The receiving panel shows "Return to game",
    and the other panels show the damage dealt to the receiver, with ± adjusting it. Badges read
    "<Opponent>: n", are hidden at 0 and turn red at 21.
  - Done: checked by hand against AC 3 and AC 4 in the UI.
  - Commit: `feat(ui): add commander damage mode and badges`

- [x] **9. Menu, winner, portrait** (10 min)
  - Goal: complete the game loop.
  - Deliverable: a center menu button with "New game", which clears the persisted match and returns to
    setup. A winner screen with congratulations and "New game". A "rotate your device" notice in portrait.
  - Done: AC 5 (winner screen) and AC 9 ("New game" clears the match) pass by hand. The portrait notice
    shows up.
  - Commit: `feat(ui): add new game menu, winner screen and portrait notice`

- [x] **10. README + AC pass** (5 min)
  - Goal: a submittable deliverable even without art.
  - Deliverable: README with "How to run", "Key decisions" and "What I left out and why".
  - Done: every AC is re-checked (except the Scryfall ones) and the README explains the decisions
    (AC 10).
  - Commit: `docs: document decisions and scope`

---
**✂️ Cut line: cut first if late. Everything below is optional for submission.**

- [ ] **11. Scryfall client** ✂️ CUT FIRST IF LATE (10 min)
  - Goal: resolve commander names to art.
  - Deliverable: `src/scryfall/` with `lookupCommander(name)` using fuzzy search. It returns the resolved
    name and `art_crop`, falling back to `card_faces[0]` for double-faced cards. Results are cached in
    memory, and network, 404 and ambiguous results come back as a typed error. Tests mock `fetch`.
  - Done: tests show a typo'd name resolves, DFC art is found, a second call hits the cache, and failures
    don't throw (part of AC 7).
  - Commit: `feat(scryfall): add commander lookup client`

- [ ] **12. Commander art in UI** ✂️ CUT FIRST IF LATE (10 min)
  - Goal: art backgrounds on panels.
  - Deliverable: setup looks up commanders on blur and on Start, with loading and error indicators. The
    resolved art URL is stored in the match. Panels use the art as their background with a dark overlay,
    and fall back to the player's color.
  - Done: checked by hand that a typo'd commander shows art and a failed lookup keeps the color and
    doesn't block the match (AC 7). The life total stays legible over bright art (AC 8). README updated.
  - Commit: `feat(ui): show commander art on panels`
