# Session 06: Setup screen + Match screen

> Reconstructed by Claude from its own session context, not a raw terminal export. User messages are
> verbatim. Claude's replies are verbatim where they were prose and shortened where they were tool output.
> There are no timestamps, so none are invented.

## User

_(The user had `ROADMAP.md` open in the IDE.)_

Read ROADMAP.md and let’s work in steps 6 y 7 Setup screen and Match screen

The idea is to progress further over the UI
Do not build extra steps and fuctionality
Do not install extra dependencies or UI libraries or templates
Use the following Google Fonts: "Firjar" for Numbers and life and OpenSans for the rest. Make the font easily able to update through the css files
Keep the styles simple, do not use CSS variables or preprocesors extra than already installed

Show me the plan and after my OK commit, export the session log and open the PR

## Claude

_Read `ROADMAP.md`, `SPEC.md`, `src/` and the latest session log. Checked that both fonts exist on Google
Fonts (HTTP 200) and that PR #4 (persistence) was already merged. Then wrote a plan and waited._

The plan: pull `master` and branch `feat/setup-match-screens`. Step 6 adds a setup screen (name,
commander and a preset color per player; blank names become "Player N"; Start creates and saves the match).
Step 7 adds a match screen (2×2 grid, top row rotated 180°, left/right tap zones for -1/+1, eliminated
panels dimmed and locked). Fonts come from one Google Fonts link in `index.html`, with the families set in
`src/index.css`. No new dependencies, no CSS variables, no UI tests. `gh` is not installed, so the PR is
opened with the GitHub MCP tool.

## User

OK, go ahead

## Claude

_Ran `git checkout master && git pull && git checkout -b feat/setup-match-screens`, wrote the UI, and ran
lint, typecheck, test (42 passed) and build: all passed. Made two commits, one per step, each with its
roadmap checkbox ticked._

- `feat(ui): add setup screen`
- `feat(ui): add match screen with rotated panels`

`App` takes an optional `storage` prop so `App.test.tsx` can render without `window.localStorage`. In the
step 6 commit, `App` showed a plain list of players after Start; step 7 replaced that with the match
screen.

### What was added
- `index.html`: Google Fonts link for Firjar and Open Sans.
- `src/index.css`: Open Sans on `body`, Firjar on a `.number` class. These are the only places to edit to
  change fonts.
- `src/ui/colors.ts`: `PLAYER_COLORS` preset palette (8 colors). Players start with the first four.
- `src/ui/SetupScreen.tsx` and `.css`: four rows with name, commander and color swatches, and Start.
- `src/ui/MatchScreen.tsx` and `.css`: `useReducer(matchReducer)`, saves to storage after every change,
  2×2 grid with the top row rotated 180°.
- `src/ui/PlayerPanel.tsx`: two half-width tap zones (-1 left, +1 right), big life total, one-line
  "name · commander", dimmed and locked when eliminated.
- `src/App.tsx`: loads a saved match on mount and shows setup if there is none.

### Not checked
The rotation, tap zones and legibility were not checked in a browser. AC 6 and the "reload goes straight
back to the match" check still need a manual pass.
