import { useEffect, useReducer, useState } from 'react'
import { getWinner, isEliminated, matchReducer } from '../game'
import type { PlayerId } from '../game'
import type { MatchState } from '../game'
import type { MatchStorage } from '../storage'
import { PlayerPanel } from './PlayerPanel'
import './MatchScreen.css'

type MatchScreenProps = {
  initialMatch: MatchState
  storage: MatchStorage
  onNewGame: () => void
}

export function MatchScreen({ initialMatch, storage, onNewGame }: MatchScreenProps) {
  const [match, dispatch] = useReducer(matchReducer, initialMatch)

  // Damage mode is UI-only state. It ends on its own if the receiver is eliminated.
  const [receiverId, setReceiverId] = useState<PlayerId | null>(null)
  const found = match.players.find((p) => p.id === receiverId)
  const receiver = found && !isEliminated(found) ? found : null

  const [menuOpen, setMenuOpen] = useState(false)
  const winner = getWinner(match)

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
      <button type="button" className="menu-button" onClick={() => setMenuOpen(true)}>
        Menu
      </button>
      {menuOpen && !winner && (
        <div className="overlay" role="dialog" aria-label="Menu">
          <button type="button" className="overlay-button" onClick={onNewGame}>
            New game
          </button>
          <button type="button" className="overlay-button secondary" onClick={() => setMenuOpen(false)}>
            Close
          </button>
        </div>
      )}
      {winner && (
        <div className="overlay" role="dialog" aria-label="Winner">
          <h1>Congratulations, {winner.name}!</h1>
          <button type="button" className="overlay-button" onClick={onNewGame}>
            New game
          </button>
        </div>
      )}
    </main>
  )
}
