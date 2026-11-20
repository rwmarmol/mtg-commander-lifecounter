import type { MatchAction, MatchState } from './types';

export function matchReducer(state: MatchState, action: MatchAction): MatchState {
  switch (action.type) {
    case 'life/adjust': {
      const target = state.players.find((p) => p.id === action.playerId);
      if (!target) return state;

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
  }
}
