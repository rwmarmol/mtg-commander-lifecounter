import { COMMANDER_DAMAGE_LETHAL, STARTING_LIFE } from './constants';
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
     case 'player/update': {
      const index = state.players.findIndex((p) => p.id === action.playerId);
      if (index < 0) return state;
      const { name, commander, color, artUrl } = action.patch;
      return {
        ...state,
        players: state.players.map((p, i) =>
          i === index
            ? {
                ...p,
                name: name === undefined ? p.name : name.trim() || `Player ${i + 1}`,
                commander: commander === undefined ? p.commander : commander.trim(),
                color: color ?? p.color,
                artUrl: artUrl === undefined ? p.artUrl : artUrl,
              }
            : p,
        ),
      };
    }
    case 'player/revive': {
      const target = state.players.find((p) => p.id === action.playerId);
      if (!target || !isEliminated(target)) return state;

      // Bring the player back to the edge: 1 life, and 20 damage from any lethal source.
      const commanderDamage = Object.fromEntries(
        Object.entries(target.commanderDamage).map(([id, d]) => [
          id,
          Math.min(d, COMMANDER_DAMAGE_LETHAL - 1),
        ]),
      );
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === target.id ? { ...p, life: Math.max(p.life, 1), commanderDamage } : p,
        ),
      };
    }
    case 'match/reset':
      return {
        players: state.players.map((p) => ({
          ...p,
          life: STARTING_LIFE,
          commanderDamage: {},
        })),
        log: [],
      };
  }
}
