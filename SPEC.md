# MTG Commander Life Counter: Spec

## Goal
Single-page web app to track life totals and commander damage in a 4-player
Commander game on one shared device laid flat on a table (landscape, two
players on each long side, facing each other). Time-boxed (~1h) take-home:
intentionally small, UI-first.

## Game rules implemented
- Exactly 4 players. Starting life: 40.
- Life changes via -1 / +1 per player.
- Commander damage: tracked per (source -> target) pair. Adding damage also
  lowers the target's life by the same amount; removing it gives that life back.
- A player is eliminated at life <= 0 OR 21+ commander damage from a single
  opponent. Eliminated panels are dimmed and locked.
- The match ends when one player remains: winner screen + "New game".

## Must have
1. Setup screen: per player, name, commander name (free text, resolved via
   Scryfall fuzzy lookup) and fallback background color (preset palette).
2. Match screen (landscape): 2x2 grid. Top row panels rotated 180deg so each
   player reads their panel upright; bottom row upright. Controls rotate
   with the panel: "+" is always on the reader's right, "-" on the left.
   Large tap zones (left/right half of the panel), not just the icons.
3. Panel content: big life total, compact one-line name + commander, and
   commander-damage badges ("<Opponent>: <n>", hidden while 0, red at 21).
4. Commander damage mode: a "Commander damage" button on each panel puts
   that panel in "receiving" mode: it shows a "Return to game" prompt; the
   other panels show the damage received from each opponent, with +/-
   adjusting that opponent -> this player damage. Exit via "Return to game".
5. Scryfall integration: commander art (art_crop) as panel background,
   dark overlay for number legibility, loading + error states, fallback to
   player color, double-faced cards (image under card_faces), cache results.
6. Persistence: current match (setup + life + damage + log) in localStorage;
   reload restores it.
7. Center menu button: "New game" (clears persisted match).
8. End of game: winner screen with congratulations.
9. Portrait orientation shows a "rotate your device" notice.

## Out of scope (deliberate) - Features
- Game Log
- Remote storage / database schema.
- History or stats of previous matches; saved player profiles.
- Variable player count; other formats (Standard 20 life, 2 players).
- Undo; +5/-5; press-and-hold repeat; numeric keypad; swipe gestures.
- Poison and other counters; partner commanders.
- Orientation lock.
- Visual identity is our own (inspired by existing life counters, no copied
  assets or branding).
- PWA and offline.

## Technical decisions
- TypeScript (strict), Vite + React, Vitest.
- Game logic as a pure reducer, tested independently of the UI.
- Scryfall client isolated and tested with mocked fetch.
- Storage behind a small adapter interface; persisted state validated
  (Zod) and versioned, so a real DB can be added later.
- CI: GitHub Actions (lint, typecheck, test, build) on push/PR;
  deploy to GitHub Pages.
- Secrets over .env files if needed for Scryfall etc.

## Acceptance criteria
- [ ] New match starts with 4 players at 40 life, 0 commander damage.
- [ ] -1/+1 changes only the intended player and appends a log entry.
- [ ] In damage mode, +/- on an opponent's panel changes damage from that
      opponent to the receiving player and adjusts the receiver's life.
- [ ] 21 damage from one opponent eliminates the target, as does life <= 0.
- [ ] Last player standing triggers the winner screen.
- [ ] Top-row panels are readable from the opposite side of the table.
- [ ] Typo'd commander name still resolves; a failed lookup keeps the color
      background and doesn't block the match.
- [ ] Life number stays legible over any commander art.
- [ ] Reload mid-match restores the exact state; "New game" clears it.
- [ ] CI green on main; app live on Pages; README explains decisions.