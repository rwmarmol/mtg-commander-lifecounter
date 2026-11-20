import type { MatchState } from '../game';
import { STORAGE_VERSION, storedMatchSchema } from './schema';
import type { MatchStorage } from './storage';

export const STORAGE_KEY = 'mtg-commander-lifecounter:match';

type KeyValueStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function createLocalStorageMatchStorage(
  store: KeyValueStore = window.localStorage,
): MatchStorage {
  return {
    load(): MatchState | null {
      try {
        const raw = store.getItem(STORAGE_KEY);
        if (raw === null) return null;
        const result = storedMatchSchema.safeParse(JSON.parse(raw));
        return result.success ? result.data.match : null;
      } catch {
        return null;
      }
    },
    save(state: MatchState): void {
      store.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, match: state }));
    },
    clear(): void {
      store.removeItem(STORAGE_KEY);
    },
  };
}
