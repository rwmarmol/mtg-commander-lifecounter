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
}

export function MatchScreen({ initialMatch, storage }: MatchScreenProps) {
  const [match, dispatch] = useReducer(matchReducer, initialMatch)

  // Damage mode is UI-only state. It ends on its own if the receiver is eliminated.
  const [receiverId, setReceiverId] = useState<PlayerId | null>(null)
  const found = match.players.find((p) => p.id === receiverId)
  const receiver = found && !isEliminated(found) ? found : null

  const [menuOpen, setMenuOpen] = useState(false)
  const winner = getWinner(match)

  function newGame() {
    dispatch({ type: 'match/reset' })
    setReceiverId(null)
    setMenuOpen(false)
  }

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
          side={i === 1 || i === 2 ? 'left' : 'right'}
          mode={!receiver ? 'normal' : receiver.id === player.id ? 'receiving' : 'source'}
          receiver={receiver}
          onEnterDamageMode={() => setReceiverId(player.id)}
          onExitDamageMode={() => setReceiverId(null)}
          onUpdate={(patch) => dispatch({ type: 'player/update', playerId: player.id, patch })}
          onRevive={() => dispatch({ type: 'player/revive', playerId: player.id })}
          onDamageChange={(delta) =>
            receiver &&
            dispatch({ type: 'damage/adjust', sourceId: player.id, targetId: receiver.id, delta })
          }
          onLifeChange={(delta) =>
            dispatch({ type: 'life/adjust', playerId: player.id, delta })
          }
        />
      ))}
      <button type="button" className="menu-button" aria-label="Menu" onClick={() => setMenuOpen(true)}>
        <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
          <polygon points="50,3 93,27 93,73 50,97 7,73 7,27" fill="#111" stroke="#fff" strokeWidth="4" strokeLinejoin="round" />
          <path d="M50,3 L93,73 M50,3 L7,73 M7,27 L93,27 M7,73 L93,73" stroke="#fff" strokeWidth="1" opacity="0.25" fill="none" />
          <path d="M30,38 H70 M30,50 H70 M30,62 H70" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
        </svg>
      </button>
      {menuOpen && !winner && (
        <div className="overlay" role="dialog" aria-label="Menu">
          <button type="button" className="overlay-button" onClick={newGame}>
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
          <button type="button" className="overlay-button" onClick={newGame}>
            New game
          </button>
        </div>
      )}
    </main>
  )
}
