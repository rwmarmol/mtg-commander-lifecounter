import { isEliminated } from '../game'
import type { LifeDelta, Player } from '../game'

type PlayerPanelProps = {
  player: Player
  rotated: boolean
  onLifeChange: (delta: LifeDelta) => void
}

export function PlayerPanel({ player, rotated, onLifeChange }: PlayerPanelProps) {
  const eliminated = isEliminated(player)
  const className = ['panel', rotated ? 'rotated' : '', eliminated ? 'eliminated' : '']
    .filter(Boolean)
    .join(' ')
  const label = player.commander ? `${player.name} · ${player.commander}` : player.name

  return (
    <section className={className} style={{ background: player.color }}>
      <button
        type="button"
        className="zone"
        aria-label={`${player.name} minus 1 life`}
        disabled={eliminated}
        onClick={() => onLifeChange(-1)}
      >
        <span className="sign">−</span>
      </button>
      <button
        type="button"
        className="zone"
        aria-label={`${player.name} plus 1 life`}
        disabled={eliminated}
        onClick={() => onLifeChange(1)}
      >
        <span className="sign">+</span>
      </button>
      <div className="info">
        <div className="life number">{player.life}</div>
        <div className="label">{label}</div>
      </div>
    </section>
  )
}
