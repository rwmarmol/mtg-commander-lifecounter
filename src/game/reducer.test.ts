import { describe, expect, it } from 'vitest';
import { createMatch } from './createMatch';
import { matchReducer } from './reducer';
import { isEliminated } from './selectors';
import type { MatchState } from './types';

const newMatch = (): MatchState =>
  createMatch({
    players: [1, 2, 3, 4].map((n) => ({
      name: `Player ${n}`,
      commander: '',
      color: `color-${n}`,
    })),
  });

const deepFreeze = <T>(value: T): T => {
  if (typeof value === 'object' && value !== null) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
};

describe('matchReducer life/adjust', () => {
  it.each([
    [1, 41],
    [-1, 39],
  ] as const)('delta %i changes only the intended player (AC 2)', (delta, expected) => {
    const before = newMatch();
    const target = before.players[2]!;

    const after = matchReducer(before, { type: 'life/adjust', playerId: target.id, delta });

    after.players.forEach((p, i) => {
      if (p.id === target.id) {
        expect(p.life).toBe(expected);
        expect({ ...p, life: 40 }).toEqual(before.players[i]);
      } else {
        expect(p).toEqual(before.players[i]);
      }
    });
  });

  it('appends one log entry with player, delta and resulting life (AC 2)', () => {
    const before = newMatch();
    const target = before.players[1]!;

    const after = matchReducer(before, { type: 'life/adjust', playerId: target.id, delta: -1 });

    expect(after.log).toEqual([
      { type: 'life', playerId: target.id, delta: -1, resultingLife: 39 },
    ]);
  });

  it('accumulates log entries in order and tracks the running life', () => {
    const [a, b] = newMatch().players;
    let state = newMatch();
    state = matchReducer(state, { type: 'life/adjust', playerId: a!.id, delta: -1 });
    state = matchReducer(state, { type: 'life/adjust', playerId: b!.id, delta: 1 });
    state = matchReducer(state, { type: 'life/adjust', playerId: a!.id, delta: -1 });

    expect(state.log).toEqual([
      { type: 'life', playerId: a!.id, delta: -1, resultingLife: 39 },
      { type: 'life', playerId: b!.id, delta: 1, resultingLife: 41 },
      { type: 'life', playerId: a!.id, delta: -1, resultingLife: 38 },
    ]);
  });

  it('does not mutate the input state and keeps untouched players by reference', () => {
    const before = deepFreeze(newMatch());
    const snapshot = JSON.parse(JSON.stringify(before)) as MatchState;
    const target = before.players[0]!;

    const after = matchReducer(before, { type: 'life/adjust', playerId: target.id, delta: 1 });

    expect(before).toEqual(snapshot);
    expect(after).not.toBe(before);
    expect(after.players).not.toBe(before.players);
    expect(after.log).not.toBe(before.log);
    expect(after.players[0]).not.toBe(before.players[0]);
    expect(after.players[1]).toBe(before.players[1]);
    expect(after.players[2]).toBe(before.players[2]);
    expect(after.players[3]).toBe(before.players[3]);
  });

  it('has no life cap and locks the player once life reaches 0 (ROADMAP decision 4)', () => {
    let state = newMatch();
    const id = state.players[0]!.id;
    for (let i = 0; i < 45; i++) {
      state = matchReducer(state, { type: 'life/adjust', playerId: id, delta: -1 });
    }
    expect(state.players[0]!.life).toBe(0);
  });

  it('returns the same state for an unknown player id', () => {
    const before = newMatch();
    const after = matchReducer(before, { type: 'life/adjust', playerId: 'nope', delta: 1 });
    expect(after).toBe(before);
  });

  it('keeps the state JSON-serializable after actions', () => {
    const before = newMatch();
    const after = matchReducer(before, {
      type: 'life/adjust',
      playerId: before.players[0]!.id,
      delta: 1,
    });
    expect(JSON.parse(JSON.stringify(after))).toEqual(after);
  });
});

describe('matchReducer player/update', () => {
  it('updates name, commander and color of one player only', () => {
    const before = deepFreeze(newMatch());
    const id = before.players[1]!.id;
    const after = matchReducer(before, {
      type: 'player/update',
      playerId: id,
      patch: { name: '  Ana ', commander: ' Atraxa ', color: '#fff' },
    });
    expect(after.players[1]).toMatchObject({ name: 'Ana', commander: 'Atraxa', color: '#fff' });
    expect(after.players[0]).toBe(before.players[0]);
  });

  it('falls back to "Player N" for a blank name', () => {
    const before = newMatch();
    const after = matchReducer(before, {
      type: 'player/update',
      playerId: before.players[2]!.id,
      patch: { name: '   ' },
    });
    expect(after.players[2]!.name).toBe('Player 3');
  });
});

describe('matchReducer player/revive', () => {
  it('revives a player at 0 life with 1 life, and they die again at 0', () => {
    let state = newMatch();
    const id = state.players[0]!.id;
    for (let i = 0; i < 40; i++) state = matchReducer(state, { type: 'life/adjust', playerId: id, delta: -1 });
    expect(isEliminated(state.players[0]!)).toBe(true);

    state = matchReducer(deepFreeze(state), { type: 'player/revive', playerId: id });
    expect(state.players[0]!.life).toBe(1);
    expect(isEliminated(state.players[0]!)).toBe(false);

    state = matchReducer(state, { type: 'life/adjust', playerId: id, delta: -1 });
    expect(isEliminated(state.players[0]!)).toBe(true);
  });

  it('revives a player eliminated by commander damage, at 20 damage', () => {
    let state = newMatch();
    const [a, b] = [state.players[0]!.id, state.players[1]!.id];
    for (let i = 0; i < 21; i++)
      state = matchReducer(state, { type: 'damage/adjust', sourceId: a, targetId: b, delta: 1 });
    expect(isEliminated(state.players[1]!)).toBe(true);

    state = matchReducer(state, { type: 'player/revive', playerId: b });
    expect(state.players[1]!.commanderDamage[a]).toBe(20);
    expect(state.players[1]!.life).toBe(19);
    expect(isEliminated(state.players[1]!)).toBe(false);

    state = matchReducer(state, { type: 'damage/adjust', sourceId: a, targetId: b, delta: 1 });
    expect(isEliminated(state.players[1]!)).toBe(true);
  });

  it('does nothing for a player who is still alive', () => {
    const before = newMatch();
    expect(matchReducer(before, { type: 'player/revive', playerId: before.players[0]!.id })).toBe(before);
  });
});

describe('matchReducer match/reset', () => {
  it('keeps the players but resets life, damage and log', () => {
    let state = newMatch();
    const [a, b] = [state.players[0]!.id, state.players[1]!.id];
    state = matchReducer(state, { type: 'damage/adjust', sourceId: a, targetId: b, delta: 1 });
    state = matchReducer(state, { type: 'player/update', playerId: a, patch: { name: 'Ana', color: '#fff' } });

    const after = matchReducer(state, { type: 'match/reset' });
    expect(after.log).toEqual([]);
    expect(after.players.map((p) => p.life)).toEqual([40, 40, 40, 40]);
    expect(after.players.every((p) => Object.keys(p.commanderDamage).length === 0)).toBe(true);
    expect(after.players[0]).toMatchObject({ id: a, name: 'Ana', color: '#fff' });
  });
});
