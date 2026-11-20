import { isEliminated } from './selectors';
import type { MatchAction, MatchState } from './types';

export function matchReducer(state: MatchState, action: MatchAction): MatchState {
  switch (action.type) {
    case 'life/adjust': {
      const target = state.players.find((p) => p.id === action.playerId);
      if (!target || isEliminated(target)) return state;

      const resultingLife = target.life + action.delta;
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === target.id ? { ...p, life: resultingLife } : p,
        ),
        log: [
          ...state.log,
          {
            type: 'life',
            playerId: target.id,
            delta: action.delta,
            resultingLife,
          },
        ],
      };
    }
    case 'damage/adjust': {
      const { sourceId, targetId, delta } = action;
      const target = state.players.find((p) => p.id === targetId);
      const source = state.players.find((p) => p.id === sourceId);
      if (!target || !source || sourceId === targetId || isEliminated(target)) return state;

      const current = target.commanderDamage[sourceId] ?? 0;
      if (current + delta < 0) return state;

      const resultingDamage = current + delta;
      const resultingLife = target.life - delta;
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === targetId
            ? {
                ...p,
                life: resultingLife,
                commanderDamage: { ...p.commanderDamage, [sourceId]: resultingDamage },
              }
            : p,
        ),
        log: [
          ...state.log,
          { type: 'damage', sourceId, targetId, delta, resultingDamage, resultingLife },
        ],
      };
    }
  }
}
