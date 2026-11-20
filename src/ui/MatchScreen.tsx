import { useEffect, useReducer, useState } from 'react'
import { isEliminated, matchReducer } from '../game'
import type { PlayerId } from '../game'
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

  // Damage mode is UI-only state. It ends on its own if the receiver is eliminated.
  const [receiverId, setReceiverId] = useState<PlayerId | null>(null)
  const found = match.players.find((p) => p.id === receiverId)
  const receiver = found && !isEliminated(found) ? found : null

  useEffect(() => {
    storage.save(match)
  }, [match, storage])

  return (
    <main className="match">
      {match.players.map((player, i) => (
        <PlayerPanel
          key={player.id}
          player={player}
          players={match.players}
          rotated={i < 2}
          mode={!receiver ? 'normal' : receiver.id === player.id ? 'receiving' : 'source'}
          receiver={receiver}
          onEnterDamageMode={() => setReceiverId(player.id)}
          onExitDamageMode={() => setReceiverId(null)}
          onDamageChange={(delta) =>
            receiver &&
            dispatch({ type: 'damage/adjust', sourceId: player.id, targetId: receiver.id, delta })
          }
          onLifeChange={(delta) =>
            dispatch({ type: 'life/adjust', playerId: player.id, delta })
          }
        />
      ))}
    </main>
  )
}
