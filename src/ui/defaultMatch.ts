import { PLAYER_COUNT, createMatch } from '../game'
import type { MatchState } from '../game'
import { PLAYER_COLORS } from './colors'

/** A fresh match with "Player N" names and distinct colors, used when nothing is saved. */
export function createDefaultMatch(): MatchState {
  return createMatch({
    players: Array.from({ length: PLAYER_COUNT }, (_, i) => ({
      name: `Player ${i + 1}`,
      commander: '',
      color: PLAYER_COLORS[i]!,
    })),
  })
}
