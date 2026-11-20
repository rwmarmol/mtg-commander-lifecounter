import { useEffect, useReducer } from 'react'
import { matchReducer } from '../game'
import type { MatchState } from '../game'
import type { MatchStorage } from '../storage'
import { PlayerPanel } from './PlayerPanel'
import './MatchScreen.css'

type MatchScreenProps = {
  initialMatch: MatchState
  storage: MatchStorage
}

export function MatchScreen({ initialMatch, storage }: MatchScreenProps) {
  const [match, dispatch] = useReducer(matchReducer, initialMatch)

  useEffect(() => {
    storage.save(match)
  }, [match, storage])

  return (
    <main className="match">
      {match.players.map((player, i) => (
        <PlayerPanel
          key={player.id}
          player={player}
          rotated={i < 2}
          onLifeChange={(delta) =>
            dispatch({ type: 'life/adjust', playerId: player.id, delta })
          }
        />
      ))}
    </main>
  )
}
