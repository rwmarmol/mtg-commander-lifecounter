import { describe, expect, it } from 'vitest';
import { createMatch } from './createMatch';
import { STARTING_LIFE } from './constants';
import type { PlayerSetup } from './types';

const player = (n: number): PlayerSetup => ({
  name: `Player ${n}`,
  commander: `Commander ${n}`,
  color: `color-${n}`,
});

const fourPlayers = (): PlayerSetup[] => [1, 2, 3, 4].map(player);

describe('createMatch', () => {
  it('starts 4 players at 40 life with no commander damage (AC 1)', () => {
    const state = createMatch({ players: fourPlayers() });

    expect(STARTING_LIFE).toBe(40);
    expect(state.players).toHaveLength(4);
    for (const p of state.players) {
      expect(p.life).toBe(40);
      expect(p.commanderDamage).toEqual({});
    }
  });

  it('starts with an empty log', () => {
    expect(createMatch({ players: fourPlayers() }).log).toEqual([]);
  });

  it('copies name, commander and color from the setup, in order', () => {
    const state = createMatch({ players: fourPlayers() });

    state.players.forEach((p, i) => {
      expect(p.name).toBe(`Player ${i + 1}`);
      expect(p.commander).toBe(`Commander ${i + 1}`);
      expect(p.color).toBe(`color-${i + 1}`);
    });
  });

  it('assigns unique, stable ids', () => {
    const ids = createMatch({ players: fourPlayers() }).players.map((p) => p.id);
    const again = createMatch({ players: fourPlayers() }).players.map((p) => p.id);

    expect(new Set(ids).size).toBe(4);
    expect(again).toEqual(ids);
  });

  it('does not share commanderDamage objects between players', () => {
    const [a, b] = createMatch({ players: fourPlayers() }).players;
    expect(a?.commanderDamage).not.toBe(b?.commanderDamage);
  });

  it('is JSON-serializable', () => {
    const state = createMatch({ players: fourPlayers() });
    expect(JSON.parse(JSON.stringify(state))).toEqual(state);
  });

  it.each([0, 1, 3, 5])('rejects %i players', (count) => {
    const players = Array.from({ length: count }, (_, i) => player(i + 1));
    expect(() => createMatch({ players })).toThrow();
  });
});
