import { describe, expect, it } from 'vitest';
import { createMatch, matchReducer } from '../game';
import type { MatchState } from '../game';
import { createLocalStorageMatchStorage, STORAGE_KEY } from './localStorageMatchStorage';
import { STORAGE_VERSION } from './schema';

function fakeStore() {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  };
}

function playedMatch(): MatchState {
  let state = createMatch({
    players: [
      { name: 'Ann', commander: 'Atraxa', color: '#e11d48' },
      { name: 'Bob', commander: '', color: '#2563eb' },
      { name: 'Cy', commander: 'Krenko', color: '#16a34a' },
      { name: 'Di', commander: '', color: '#ca8a04' },
    ],
  });
  state = matchReducer(state, { type: 'life/adjust', playerId: 'p1', delta: -1 });
  state = matchReducer(state, { type: 'damage/adjust', sourceId: 'p2', targetId: 'p3', delta: 1 });
  return state;
}

describe('createLocalStorageMatchStorage', () => {
  it('round-trips the exact state', () => {
    const storage = createLocalStorageMatchStorage(fakeStore());
    const state = playedMatch();
    storage.save(state);
    expect(storage.load()).toEqual(state);
  });

  it('returns null when nothing is stored', () => {
    expect(createLocalStorageMatchStorage(fakeStore()).load()).toBeNull();
  });

  it('returns null for corrupt JSON', () => {
    const store = fakeStore();
    store.data.set(STORAGE_KEY, '{not json');
    expect(createLocalStorageMatchStorage(store).load()).toBeNull();
  });

  it('returns null for data with the wrong shape', () => {
    const store = fakeStore();
    const match = playedMatch();
    const bad = { ...match, log: [{ type: 'life', playerId: 'p1', delta: 5, resultingLife: 1 }] };
    store.data.set(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, match: bad }));
    expect(createLocalStorageMatchStorage(store).load()).toBeNull();

    store.data.set(
      STORAGE_KEY,
      JSON.stringify({ version: STORAGE_VERSION, match: { players: match.players } }),
    );
    expect(createLocalStorageMatchStorage(store).load()).toBeNull();
  });

  it('returns null on a version mismatch', () => {
    const store = fakeStore();
    store.data.set(
      STORAGE_KEY,
      JSON.stringify({ version: STORAGE_VERSION + 1, match: playedMatch() }),
    );
    expect(createLocalStorageMatchStorage(store).load()).toBeNull();
  });

  it('clear empties storage', () => {
    const store = fakeStore();
    const storage = createLocalStorageMatchStorage(store);
    storage.save(playedMatch());
    storage.clear();
    expect(store.data.size).toBe(0);
    expect(storage.load()).toBeNull();
  });
});
