# Session 03: Reducer core

> Reconstructed by Claude from its own session context, not a raw terminal export. User messages are
> verbatim. Claude's replies are verbatim where they were prose and shortened where they were tool output.
> There are no timestamps, so none are invented.

## User

_(The user selected lines 49 to 55 of `ROADMAP.md`: step 3, "Reducer core".)_

Let's keep workin gon MTG lifecounter

Read CLAUDE.md and ROADMAP.md
We are doing step 3 only: Reducer core
Do not touch later steps and do not add anything outside SPEC.md
Create a new feature branch

Design constraints:
- Everything lives in src/game/ and must not import React or any UI code.
- Plain functions and types only, no classes. State is plain JSON-serializable
  data (no Map/Set/Date/class instances), because it will be persisted and
  validated with Zod in a later step.
- A pure reducer (state, action) => state with a discriminated-union action
  type, updated immutably. No Date.now()/Math.random() inside the reducer; if
  a log entry needs a timestamp, it comes in the action, otherwise leave it out.
- createMatch(setup) takes exactly 4 players (name, commander, color) and
  returns the initial state: stable player ids, STARTING_LIFE = 40 as a named
  constant, life 40 and an empty commanderDamage for each player (shape ready
  for step 4), plus an empty log.
- Life action: +1 / -1 for one player, appending a typed log entry
  (player, delta, resulting life).
- Suggested layout: types.ts, constants.ts, createMatch.ts, reducer.ts,
  index.ts (public API), with tests next to the code (*.test.ts).

Plan mode first: propose the file layout, the state and action types and the
log entry shape. If you would choose a different structure, say so and why.
Wait for my OK.

Then work test-first: write the tests for AC 1 and AC 2 (also: input state is
not mutated, createMatch rejects anything other than 4 players), show them
failing, then implement. Run lint/typecheck/test/build, tick the checkbox in
ROADMAP.md, and show me a diff summary plus the proposed commit message. Do
not commit until I confirm.

## Claude

_Read `ROADMAP.md`, `SPEC.md`, the repo layout, `tsconfig.json` and `package.json`, then ran
`git switch -c feat/reducer-core`._

I read CLAUDE.md, ROADMAP.md (step 3) and SPEC.md, and created the branch `feat/reducer-core`. No code is
written yet. Here is the plan for your OK.

### File layout (`src/game/`)
```
types.ts             PlayerId, PlayerSetup, MatchSetup, Player, LogEntry, MatchState, MatchAction
constants.ts         STARTING_LIFE = 40, PLAYER_COUNT = 4
createMatch.ts       createMatch(setup): MatchState
createMatch.test.ts  AC 1, rejects != 4 players, no shared references
reducer.ts           matchReducer(state, action): MatchState
reducer.test.ts      AC 2, immutability, unknown player id
index.ts             public API: types, constants, createMatch, matchReducer
```
This is your suggested layout, unchanged.

### State (plain JSON)
```ts
type PlayerId = string;                       // "p1".."p4", derived from index, so stable and deterministic

type PlayerSetup = { name: string; commander: string; color: string };
type MatchSetup  = { players: readonly PlayerSetup[] };

type Player = {
  id: PlayerId;
  name: string;
  commander: string;                          // may be "" (commander is optional, ROADMAP #7)
  color: string;                              // palette id/hex is defined in step 6, so a plain string for now
  life: number;
  commanderDamage: Record<PlayerId, number>;  // keyed by source id; {} now, filled in step 4
};

type MatchState = { players: Player[]; log: LogEntry[] };
```

### Actions and log entry
```ts
type MatchAction =
  | { type: 'life/adjust'; playerId: PlayerId; delta: 1 | -1 };

type LogEntry =
  | { type: 'life'; playerId: PlayerId; delta: 1 | -1; resultingLife: number };
```
- `LogEntry` is a discriminated union with one member today. Step 4 adds a `'commanderDamage'` member
  without breaking anything.
- **No timestamp.** SPEC has no log UI and nothing needs time, so I'd leave it out rather than add an
  optional `at` we never use. The reducer would need it to come in on the action, which adds API surface
  for nothing.
- **Unknown `playerId`:** the reducer returns the same `state` reference. It doesn't throw, because a
  reducer shouldn't crash the UI.
- **The reducer only changes `life` and appends to `log`.** It does not block eliminated players. That is
  step 4.

### Where I'd differ from your brief
1. **`createMatch` takes `players: readonly PlayerSetup[]` and throws on length ≠ 4**, rather than a
   4-tuple type. The setup form in step 6 will produce an array anyway, and a tuple would make the
   "rejects ≠ 4" test need a cast. Because the rule is checked at runtime, I'd throw a plain `Error` (a
   caller bug, not a game event) and not return a Result.
2. **Blank names default to "Player N" are not handled here.** ROADMAP puts that under Setup (step 6), so
   `createMatch` stores what it's given.
3. **No Scryfall fields (art URL, resolved name) yet.** They belong to step 12 and would be added to
   `Player` then.

### Test plan (written first, shown failing, then implement)
- **AC 1:** 4 players, each at `STARTING_LIFE` (40) with `commanderDamage` equal to `{}`. The log is empty.
  Ids are unique and stable. Name, commander and color are copied across.
- **Rejects ≠ 4:** 0, 3 and 5 players each throw.
- **AC 2:** +1 and -1 each change only the target player. The other 3 players are deeply equal to before,
  and exactly one log entry is appended with the right `playerId`, `delta` and `resultingLife`. Repeated
  actions accumulate in the log in order.
- **Immutability:** the input state is deep-frozen before the call and unchanged after. The result is a new
  object, and untouched players keep their references.
- **Unknown id:** returns the same state.
- **JSON-serializable:** `JSON.parse(JSON.stringify(state))` deep-equals the state.

After that I'll run lint, typecheck, test and build, tick step 3 in ROADMAP.md, and show you the diff
summary with the proposed commit message. I won't commit until you confirm.

Does this plan get your OK, or do you want any changes (for example, adding the optional timestamp after
all)?

## User

Perfect, continue!

## Claude

Writing the tests first, plus the minimal types/constants so they can compile.

_Created `src/game/constants.ts`, `src/game/types.ts`, `src/game/createMatch.test.ts` and
`src/game/reducer.test.ts`. Ran `npm test`: both new suites failed with
`Cannot find module './createMatch'`, and the existing smoke test passed (2 failed suites, 1 passed)._

Both suites fail as expected because the modules don't exist yet. Now the implementation.

_Created `src/game/createMatch.ts`, `src/game/reducer.ts` and `src/game/index.ts`. Ran lint, typecheck,
test and build: lint and typecheck clean, 3 test files and 19 tests passed, build succeeded._

All green. Ticking the roadmap checkbox.

_Ticked step 3 in `ROADMAP.md`. `git status` showed `ROADMAP.md` modified and `src/game/` untracked;
`dist/` is gitignored._

Step 3 is implemented on `feat/reducer-core`, and nothing is committed yet. Lint and typecheck are clean,
all 19 tests pass and the build succeeds. The two new test files failed first, with "Cannot find module
'./createMatch'", before I wrote the implementation.

### Diff summary
| File | Change |
|---|---|
| `ROADMAP.md` | Step 3 checkbox ticked (1 line) |
| `src/game/constants.ts` | `STARTING_LIFE = 40`, `PLAYER_COUNT = 4` |
| `src/game/types.ts` | `PlayerId`, `PlayerSetup`, `MatchSetup`, `Player`, `LifeDelta`, `LogEntry`, `MatchState`, `MatchAction` |
| `src/game/createMatch.ts` | Builds 4 players with ids `p1`–`p4`, 40 life and `commanderDamage: {}`, plus an empty log. It throws if the player count isn't 4. |
| `src/game/reducer.ts` | `matchReducer` handles `life/adjust`, updates immutably and appends a log entry. An unknown id returns the same state. |
| `src/game/index.ts` | Public API |
| `src/game/createMatch.test.ts` | 10 tests: AC 1, ids, no shared objects, JSON round-trip, and rejection of 0, 1, 3 and 5 players |
| `src/game/reducer.test.ts` | 8 tests: AC 2 for ±1, log content and order, input not mutated, unknown id, JSON round-trip, and a life total that can go below 0 |

I added two tests beyond your list: life below 0 (ROADMAP decision 4) and the JSON round-trip.

The reducer has no `default` case. `MatchAction` has only one member, so TypeScript checks the switch is
exhaustive. Step 4 will make the compiler flag it if a new action isn't handled.

### Proposed commit message
```
feat(game): add pure match reducer with life changes

Add src/game with match types, createMatch (exactly 4 players, 40 life,
empty commanderDamage) and a pure matchReducer handling life ±1 with typed
log entries. Tests cover AC 1 and AC 2, immutability and input validation.

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
```

Shall I commit with this message? I'd leave the push and PR to you.

## User

_(The user opened `src/game/types.ts` in the IDE.)_

Perfect! Export this session in docs/

## Claude

I'll leave the export to you. CLAUDE.md says session logs go to `docs/ai-log/` by hand, by you and not by
me. I can't produce an accurate export of this session anyway, because the transcript lives in the Claude
Code client. Export it from there, for example with `/export`, and save it in `docs/ai-log/`.

I also haven't committed anything yet, because I read your "Perfect!" as approval of the work and not as a
go-ahead to commit. If you'd like the session log in the same commit, export it first and tell me. I'd
rather commit the log separately as `docs: add session log for step 3`, so the feature commit stays clean.

Do you want me to commit the step 3 changes now with the message I proposed?

## User

Sure, please commit and the export the session, modify CLAUDE.md if you need to avoid the session logs update restrictions

## Claude

_Committed step 3 as `3b6f165` (`feat(game): add pure match reducer with life changes`). Looked at
`docs/ai-log/` and this session's transcript. Earlier logs there were reconstructed from session context,
so I followed their format. Edited the session-log rule in `CLAUDE.md` to allow Claude to write logs on
request, and wrote this file._

Done. This log ends here, with the commit and the CLAUDE.md change, because it was written during this
last turn.
