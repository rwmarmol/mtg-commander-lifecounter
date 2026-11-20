import { PLAYER_COUNT, STARTING_LIFE } from './constants';
import type { MatchSetup, MatchState } from './types';

export function createMatch(setup: MatchSetup): MatchState {
  if (setup.players.length !== PLAYER_COUNT) {
    throw new Error(
      `A match needs exactly ${PLAYER_COUNT} players, got ${setup.players.length}`,
    );
  }

  return {
    players: setup.players.map((p, i) => ({
      id: `p${i + 1}`,
      name: p.name,
      commander: p.commander,
      color: p.color,
      artUrl: p.artUrl ?? null,
      life: STARTING_LIFE,
      commanderDamage: {},
    })),
    log: [],
  };
}
