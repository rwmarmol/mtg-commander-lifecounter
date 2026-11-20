# MTG Commander Life Counter

A single-page web app that tracks life totals and commander damage in a 4-player Commander game. It's
meant for one shared device lying flat on the table in landscape, with two players on each long side.
Commander art comes from Scryfall.

See [SPEC.md](SPEC.md) for scope and [ROADMAP.md](ROADMAP.md) for progress.

## Stack
TypeScript (strict), Vite + React, Vitest, Zod, with GitHub Actions CI and deploys to GitHub Pages.

## How to run
```
npm install
npm run dev        # start the dev server
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm test           # Vitest
npm run build      # production build
```

## Key decisions
- **Pure reducer:** all rules (life, commander damage, elimination, revive, winner) live in `src/game/`
  with no React or storage imports, and are tested on their own.
- **Elimination is derived**, never stored: life <= 0 or 21+ damage from one opponent. Revive sets life to
  at least 1 and lowers lethal damage to 20.
- **Persistence behind an adapter:** `src/storage/` has a `MatchStorage` interface, a localStorage
  implementation and a versioned Zod schema. Invalid or outdated data loads as "no match".
- **No setup screen:** the app opens on the match grid. Tapping a panel's name edits name, commander and color.
  "New game" keeps the players and resets the counters.
- **Damage mode** is UI-only state and is not persisted.
- **Tests cover logic only** (reducer, storage, Scryfall client). The UI is checked by hand.

## What I left out and why
Everything listed as out of scope in [SPEC.md](SPEC.md): game log UI (the log is kept in state but not
shown), undo, other formats or player counts, extra counters, partner commanders, orientation lock, remote
storage and PWA/offline. The app is a time-boxed take-home, so it stays small and UI-first.
