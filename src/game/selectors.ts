import { COMMANDER_DAMAGE_LETHAL } from './constants';
import type { MatchState, Player } from './types';

export function isEliminated(player: Player): boolean {
  return (
    player.life <= 0 ||
    Object.values(player.commanderDamage).some((d) => d >= COMMANDER_DAMAGE_LETHAL)
  );
}

export function getEliminatedIds(state: MatchState): string[] {
  return state.players.filter(isEliminated).map((p) => p.id);
}

/** The last player standing, or null while more than one (or nobody) remains. */
export function getWinner(state: MatchState): Player | null {
  const alive = state.players.filter((p) => !isEliminated(p));
  return alive.length === 1 ? alive[0]! : null;
}
