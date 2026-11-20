# Session 04: Commander damage + elimination

> Reconstructed by Claude from its own session context, not a raw terminal export. User messages are
> verbatim. Claude's replies are verbatim where they were prose and shortened where they were tool output.
> There are no timestamps, so none are invented.

## User

_(The user selected line 57 of `ROADMAP.md`: "4. Commander damage + elimination".)_

Read ROADMAP.md In this session we will be working on step 4. Commander damage + elimination
Pull master branch and create a new feature branch
Keep the logic simple and do not add additional features outside the SPEC.md
Test the functionality and add the test cases needed

## Claude

_Ran `git checkout master && git pull && git checkout -b feat/commander-damage`, then read `ROADMAP.md`,
`SPEC.md` and everything in `src/game/`. Wrote the code and tests, ran lint, typecheck and test._

One existing test failed: `reducer.test.ts` asserted that life can go below 0, which contradicts the new
rule that eliminated players ignore actions. I changed it to assert that life stops at 0.

After that lint, typecheck and all 36 tests passed. I ticked step 4 in `ROADMAP.md` and committed as
`feat(game): add commander damage, elimination and winner`.

### What was added in `src/game/`
- `constants.ts`: `COMMANDER_DAMAGE_LETHAL = 21`.
- `types.ts`: `LogEntry` is now `LifeLogEntry | DamageLogEntry`. `MatchAction` gains
  `{ type: 'damage/adjust'; sourceId; targetId; delta }`.
- `reducer.ts`: `damage/adjust` changes the target's life by `-delta` and the pair counter by `delta`, and
  logs the result. A "-" at 0, self-damage, unknown ids and an eliminated target are no-ops. An
  eliminated player also ignores `life/adjust`. Damage from an eliminated source is allowed (ROADMAP
  decision 5).
- `selectors.ts`: `isEliminated`, `getEliminatedIds` and `getWinner`, all derived from life and damage and
  never stored.
- `damage.test.ts`: AC 3 (damage moves life, per-source counters, no-op at 0), AC 4 (20 vs 21 damage,
  life 1 vs 0, no revival) and AC 5 (winner is the last player standing, null otherwise).

## User

Perfect!
Please commit, the export the session log and open the PR
