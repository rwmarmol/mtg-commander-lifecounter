import { useState } from 'react'
import { PLAYER_COUNT, createMatch } from '../game'
import type { MatchState, PlayerSetup } from '../game'
import { PLAYER_COLORS } from './colors'
import './SetupScreen.css'

type SetupScreenProps = {
  onStart: (match: MatchState) => void
}

export function SetupScreen({ onStart }: SetupScreenProps) {
  const [players, setPlayers] = useState<PlayerSetup[]>(() =>
    Array.from({ length: PLAYER_COUNT }, (_, i) => ({
      name: '',
      commander: '',
      color: PLAYER_COLORS[i]!,
    })),
  )

  function update(index: number, patch: Partial<PlayerSetup>) {
    setPlayers((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)))
  }

  function start() {
    onStart(
      createMatch({
        players: players.map((p, i) => ({
          ...p,
          name: p.name.trim() || `Player ${i + 1}`,
          commander: p.commander.trim(),
        })),
      }),
    )
  }

  return (
    <main className="setup">
      <h1>New game</h1>
      {players.map((player, i) => (
        <div className="setup-row" key={i}>
          <input
            aria-label={`Player ${i + 1} name`}
            placeholder={`Player ${i + 1}`}
            value={player.name}
            onChange={(e) => update(i, { name: e.target.value })}
          />
          <input
            aria-label={`Player ${i + 1} commander`}
            placeholder="Commander (optional)"
            value={player.commander}
            onChange={(e) => update(i, { commander: e.target.value })}
          />
          <div className="setup-colors">
            {PLAYER_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={`Player ${i + 1} color ${color}`}
                aria-pressed={player.color === color}
                className={player.color === color ? 'swatch selected' : 'swatch'}
                style={{ background: color }}
                onClick={() => update(i, { color })}
              />
            ))}
          </div>
        </div>
      ))}
      <button type="button" className="start" onClick={start}>
        Start
      </button>
    </main>
  )
}
