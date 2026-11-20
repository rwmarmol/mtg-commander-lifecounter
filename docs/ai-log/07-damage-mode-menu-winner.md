# Session 07: Commander damage mode + Menu, winner, portrait (+ in-panel editing and revive)

> Reconstructed by Claude from its own session context, not a raw terminal export. User messages are
> verbatim. Claude's replies are verbatim where they were prose and shortened where they were tool output.
> There are no timestamps, so none are invented.

## User

_(The user had `ROADMAP.md` open in the IDE.)_

Let’s work on MTG lifecounter project
Read ROADMAP.md, we will be working on steps 8. Commander damage mode and 9. Menu, winner, portrait

Do not implement extra steps beyond SPEC
Keep the logic simple
Start from master branch and create a new feature branch

Show me the plan first, after my review I am going to ask about a few changes over the complete the game loop (Staring window, Menu button in center etc)

## Claude

_Checked out `master`, pulled (PR #5 was merged), created `feat/damage-mode-menu-winner`, and read the
roadmap, spec, reducer, selectors and UI. Then wrote a plan and waited._

The plan: both steps are UI-only because the reducer already has `damage/adjust`, `isEliminated` and
`getWinner`. Step 8: `receiverId` UI state in `MatchScreen` (not persisted), a "Commander damage" button
per panel, "Return to game" on the receiver, other panels show and adjust the damage they dealt to the
receiver, and badges "<Opponent>: n" hidden at 0 and red at 21. Step 9: a center menu button with "New
game", a winner overlay derived from `getWinner`, and a CSS-only portrait notice. Two open questions: no
confirm step before "New game", and the winner screen as an overlay.

## User

Perfect, go ahead

## Claude

_Implemented step 8 and committed it, then step 9 and committed it. Lint, typecheck, test (42 passed) and
build passed._

- `feat(ui): add commander damage mode and badges`
- `feat(ui): add new game menu, winner screen and portrait notice`

Damage mode ends by itself if the receiver is eliminated. `prettier --check` flags many files, including
older ones; it is not a project command, so it was left alone.

## User

Perfect!
I would like to keep the new game screen integrated in the lifecounter screen
Example:
- A new game, always land over the 2x2 grid
- Player can select their names and color through the layout screen

I just want to kee the experiencie simple without extra screens
Starting a new game keep the players names and only restart the counter
Also, an eliminated player could revive by adding life whit a button revive

## Claude

Wrote a plan before coding, because the request contradicts `SPEC.md` (setup screen, eliminated panels
locked) and ROADMAP decision 3 ("no revival"): remove the setup screen and open on a default match; edit
name, commander and color on the panel through a `player/update` action; `match/reset` keeps players and
resets counters; `player/revive` for eliminated players. Asked three questions: revive semantics, whether
to edit the spec and roadmap, and where the editor opens.

## User

Yes, about Revive: I am OK either common and commander damage could be revived by clicking the button, will be elimitated if counter goes zero again

Please edit the Spec and add this function, keep it simple

Panel editor, a tap in center

## Claude

_Added the three reducer actions with tests (48 passed) and committed them, then did the UI and docs._

- `feat(game): add player update, revive and match reset actions`
- `feat(ui): edit players in place, revive button and new game that keeps players`

Revive sets life to at least 1 and lowers any commander damage at 21 or more to 20, so the player is
eliminated again as soon as a counter hits the limit. "Tap in center" was read as tapping the name text in
the middle of the panel.

### What was added
- `src/game/`: `player/update` (trims, blank name becomes "Player N"), `player/revive`, `match/reset`.
- `src/ui/PlayerPanel.tsx`: mode (`normal | receiving | source`), badges, "Commander damage", "Return to
  game", "Revive", and the name button that opens the editor.
- `src/ui/PlayerEditor.tsx`: draft name, commander and color, applied on "Done".
- `src/ui/MatchScreen.tsx`: damage mode state, center menu, winner overlay, `newGame` dispatches
  `match/reset`.
- `src/ui/defaultMatch.ts`: default match used when nothing is saved. `SetupScreen` and its CSS removed.
- `src/index.css`, `src/ui/MatchScreen.css`: portrait notice and the new styles.
- `SPEC.md`, `ROADMAP.md`: setup, elimination, center menu and acceptance criteria updated.

### Not checked
Nothing was checked in a browser: damage mode against AC 3 and AC 4, the winner screen (AC 5), the
portrait notice, the in-panel editor on rotated panels, and revive still need a manual pass. The winner
overlay covers the grid, so nobody can be revived while it shows.
