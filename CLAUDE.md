# CLAUDE.md

4-player MTG Commander life counter: a single-page web app for one shared device lying flat on the table.
**`SPEC.md` is the source of truth.** `ROADMAP.md` holds the ordered steps and the decisions taken on
spec ambiguities.

## Stack
TypeScript (strict), Vite + React, Vitest, Zod, ESLint. GitHub Actions CI, deployed to GitHub Pages.

## Commands
- `npm run dev`: start the dev server
- `npm run lint`: run ESLint
- `npm run typecheck`: run `tsc --noEmit`
- `npm test`: run Vitest
- `npm run build`: production build

## Code conventions
- Strict TS. No `any`. Prefer named exports.
- `src/game/`: pure match reducer and types, with no React, DOM or storage imports.
- `src/storage/`: storage adapter interface, localStorage implementation, versioned Zod schema.
- `src/scryfall/`: isolated Scryfall client, tested with mocked `fetch`.
- `src/ui/`: React components. Keep logic out of them and dispatch reducer actions.
- Tests sit next to the code they cover (`*.test.ts`).

## Working rules
- One roadmap step per session. Stop when its done criteria are met and tick its checkbox in `ROADMAP.md`.
- Small commits with conventional messages (`feat:`, `fix:`, `chore:`, `ci:`, `docs:`, `test:`).
  Tests land in the same commit as the logic they cover.
- Ask before adding any dependency, and prefer fewer.
- Game logic stays a pure reducer, tested independently of the UI.
- Keep `CLAUDE.md` and `README.md` short. Don't invent features beyond `SPEC.md`.
  If the spec is unclear, follow the defaults in `ROADMAP.md` or ask.
- Session logs live in `docs/ai-log/` (`NN-step-name.md`). Claude writes one when the user asks, in the
  format of the existing logs, and commits it separately as `docs:`.
