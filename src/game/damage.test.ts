import { describe, expect, it } from 'vitest';
import { createMatch } from './createMatch';
import { matchReducer } from './reducer';
import { getEliminatedIds, getWinner, isEliminated } from './selectors';
import type { MatchAction, MatchState } from './types';

const newMatch = (): MatchState =>
  createMatch({
    players: [1, 2, 3, 4].map((n) => ({
      name: `Player ${n}`,
      commander: '',
      color: `color-${n}`,
    })),
  });

const run = (state: MatchState, ...actions: MatchAction[]): MatchState =>
  actions.reduce(matchReducer, state);

const damage = (sourceId: string, targetId: string, delta: 1 | -1): MatchAction => ({
  type: 'damage/adjust',
  sourceId,
  targetId,
  delta,
});

const repeat = (action: MatchAction, n: number): MatchAction[] =>
  Array.from({ length: n }, () => action);

describe('matchReducer damage/adjust', () => {
  it('+1 damage raises the pair counter and lowers the receiver life (AC 3)', () => {
    const before = newMatch();
    const after = run(before, damage('p1', 'p2', 1));

    expect(after.players[1]!.commanderDamage).toEqual({ p1: 1 });
    expect(after.players[1]!.life).toBe(39);
    expect(after.players[0]).toBe(before.players[0]);
    expect(after.players[2]).toBe(before.players[2]);
    expect(after.players[3]).toBe(before.players[3]);
  });

  it('-1 damage gives the life back (AC 3)', () => {
    const after = run(newMatch(), damage('p1', 'p2', 1), damage('p1', 'p2', 1), damage('p1', 'p2', -1));

    expect(after.players[1]!.commanderDamage).toEqual({ p1: 1 });
    expect(after.players[1]!.life).toBe(39);
  });

  it('tracks damage per source separately', () => {
    const after = run(newMatch(), damage('p1', 'p3', 1), damage('p2', 'p3', 1), damage('p2', 'p3', 1));

    expect(after.players[2]!.commanderDamage).toEqual({ p1: 1, p2: 2 });
    expect(after.players[2]!.life).toBe(37);
  });

  it('-1 at 0 is a no-op and gives no life back', () => {
    const before = newMatch();
    expect(run(before, damage('p1', 'p2', -1))).toBe(before);
  });

  it('ignores unknown players and self damage', () => {
    const before = newMatch();
    expect(run(before, damage('nope', 'p2', 1))).toBe(before);
    expect(run(before, damage('p1', 'nope', 1))).toBe(before);
    expect(run(before, damage('p1', 'p1', 1))).toBe(before);
  });

  it('appends a damage log entry', () => {
    const after = run(newMatch(), damage('p1', 'p2', 1));
    expect(after.log).toEqual([
      {
        type: 'damage',
        sourceId: 'p1',
        targetId: 'p2',
        delta: 1,
        resultingDamage: 1,
        resultingLife: 39,
      },
    ]);
  });

  it('does not log a no-op', () => {
    expect(run(newMatch(), damage('p1', 'p2', -1)).log).toEqual([]);
  });

  it('allows damage from an eliminated source', () => {
    const state = run(newMatch(), ...repeat({ type: 'life/adjust', playerId: 'p1', delta: -1 }, 40));
    expect(isEliminated(state.players[0]!)).toBe(true);

    const after = run(state, damage('p1', 'p2', 1));
    expect(after.players[1]!.commanderDamage).toEqual({ p1: 1 });
  });
});

describe('elimination', () => {
  it('nobody is eliminated at the start', () => {
    expect(getEliminatedIds(newMatch())).toEqual([]);
  });

  it('20 damage from one source does not eliminate, 21 does (AC 4)', () => {
    const at20 = run(newMatch(), ...repeat(damage('p1', 'p2', 1), 20));
    expect(isEliminated(at20.players[1]!)).toBe(false);

    const at21 = run(at20, damage('p1', 'p2', 1));
    expect(isEliminated(at21.players[1]!)).toBe(true);
    expect(getEliminatedIds(at21)).toEqual(['p2']);
  });

  it('damage spread over several sources does not eliminate by commander damage', () => {
    const state = run(
      newMatch(),
      ...repeat(damage('p1', 'p4', 1), 14),
      ...repeat(damage('p2', 'p4', 1), 14),
    );
    expect(state.players[3]!.life).toBe(12);
    expect(isEliminated(state.players[3]!)).toBe(false);
  });

  it('life at 1 is alive, life at 0 is eliminated (AC 4)', () => {
    const at1 = run(newMatch(), ...repeat({ type: 'life/adjust', playerId: 'p1', delta: -1 }, 39));
    expect(isEliminated(at1.players[0]!)).toBe(false);

    const at0 = run(at1, { type: 'life/adjust', playerId: 'p1', delta: -1 });
    expect(isEliminated(at0.players[0]!)).toBe(true);
  });

  it('eliminated players ignore life and damage actions', () => {
    const dead = run(newMatch(), ...repeat({ type: 'life/adjust', playerId: 'p1', delta: -1 }, 40));

    expect(run(dead, { type: 'life/adjust', playerId: 'p1', delta: 1 })).toBe(dead);
    expect(run(dead, damage('p2', 'p1', 1))).toBe(dead);
    expect(run(dead, damage('p2', 'p1', -1))).toBe(dead);
  });

  it('a player eliminated by commander damage cannot be revived by removing it', () => {
    const dead = run(newMatch(), ...repeat(damage('p1', 'p2', 1), 21));
    expect(run(dead, damage('p1', 'p2', -1))).toBe(dead);
    expect(run(dead, { type: 'life/adjust', playerId: 'p2', delta: 1 })).toBe(dead);
  });
});

describe('getWinner', () => {
  it('is null at the start and while several players remain', () => {
    expect(getWinner(newMatch())).toBeNull();

    const twoDown = run(
      newMatch(),
      ...repeat({ type: 'life/adjust', playerId: 'p1', delta: -1 }, 40),
      ...repeat({ type: 'life/adjust', playerId: 'p2', delta: -1 }, 40),
    );
    expect(getWinner(twoDown)).toBeNull();
  });

  it('is the last player standing, however the others were eliminated (AC 5)', () => {
    const state = run(
      newMatch(),
      ...repeat({ type: 'life/adjust', playerId: 'p1', delta: -1 }, 40),
      ...repeat(damage('p1', 'p2', 1), 21),
      ...repeat(damage('p2', 'p3', 1), 21),
    );
    expect(getEliminatedIds(state)).toEqual(['p1', 'p2', 'p3']);
    expect(getWinner(state)?.id).toBe('p4');
  });

  it('is null when everyone is eliminated', () => {
    const state = run(
      newMatch(),
      ...['p1', 'p2', 'p3', 'p4'].flatMap((id) =>
        repeat({ type: 'life/adjust', playerId: id, delta: -1 }, 40),
      ),
    );
    expect(getWinner(state)).toBeNull();
  });
});
