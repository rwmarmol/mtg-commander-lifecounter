export { COMMANDER_DAMAGE_LETHAL, PLAYER_COUNT, STARTING_LIFE } from './constants';
export { createMatch } from './createMatch';
export { matchReducer } from './reducer';
export { getEliminatedIds, getWinner, isEliminated } from './selectors';
export type {
  DamageLogEntry,
  LifeDelta,
  LifeLogEntry,
  LogEntry,
  MatchAction,
  MatchSetup,
  MatchState,
  Player,
  PlayerId,
  PlayerSetup,
} from './types';
