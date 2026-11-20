import type { MatchState } from '../game';

export interface MatchStorage {
  /** Returns the saved match, or null if nothing valid is stored. */
  load(): MatchState | null;
  save(state: MatchState): void;
  clear(): void;
}
