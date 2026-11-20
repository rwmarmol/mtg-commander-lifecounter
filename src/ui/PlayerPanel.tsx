import { COMMANDER_DAMAGE_LETHAL, isEliminated } from '../game'
import type { LifeDelta, Player } from '../game'

export type PanelMode = 'normal' | 'receiving' | 'source'

type PlayerPanelProps = {
  player: Player
  /** All players, used to name the sources of commander damage badges. */
  players: readonly Player[]
  rotated: boolean
  mode: PanelMode
  /** The player receiving damage while in damage mode. */
  receiver: Player | null
  onLifeChange: (delta: LifeDelta) => void
  onDamageChange: (delta: LifeDelta) => void
  onEnterDamageMode: () => void
  onExitDamageMode: () => void
}

export function PlayerPanel({
  player,
  players,
  rotated,
  mode,
  receiver,
  onLifeChange,
  onDamageChange,
  onEnterDamageMode,
  onExitDamageMode,
}: PlayerPanelProps) {
  const eliminated = isEliminated(player)
  const className = ['panel', rotated ? 'rotated' : '', eliminated ? 'eliminated' : '']
    .filter(Boolean)
    .join(' ')
  const label = player.commander ? `${player.name} · ${player.commander}` : player.name

  // Damage mode: the receiver's own zones are inert; other panels adjust their damage to it.
  const zonesDisabled = mode === 'receiving' || (mode === 'normal' && eliminated)
  const onZone = (delta: LifeDelta) =>
    mode === 'source' ? onDamageChange(delta) : onLifeChange(delta)
  const damageDealt = receiver?.commanderDamage[player.id] ?? 0

  const badges = players
    .filter((p) => p.id !== player.id && (player.commanderDamage[p.id] ?? 0) > 0)
    .map((p) => ({ id: p.id, name: p.name, damage: player.commanderDamage[p.id] ?? 0 }))

  return (
    <section className={className} style={{ background: player.color }}>
      <button
        type="button"
        className="zone"
        aria-label={`${player.name} minus 1 ${mode === 'source' ? 'commander damage' : 'life'}`}
        disabled={zonesDisabled}
        onClick={() => onZone(-1)}
      >
        <span className="sign">−</span>
      </button>
      <button
        type="button"
        className="zone"
        aria-label={`${player.name} plus 1 ${mode === 'source' ? 'commander damage' : 'life'}`}
        disabled={zonesDisabled}
        onClick={() => onZone(1)}
      >
        <span className="sign">+</span>
      </button>
      <div className="info">
        {mode === 'source' && receiver ? (
          <>
            <div className="life number">{damageDealt}</div>
            <div className="label">Damage to {receiver.name}</div>
          </>
        ) : (
          <>
            <div className="life number">{player.life}</div>
            <div className="label">{label}</div>
            {badges.length > 0 && (
              <div className="badges">
                {badges.map((b) => (
                  <span
                    key={b.id}
                    className={b.damage >= COMMANDER_DAMAGE_LETHAL ? 'badge lethal' : 'badge'}
                  >
                    {b.name}: {b.damage}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      {mode === 'receiving' && (
        <button type="button" className="mode-button return" onClick={onExitDamageMode}>
          Return to game
        </button>
      )}
      {mode === 'normal' && (
        <button
          type="button"
          className="mode-button"
          disabled={eliminated}
          onClick={onEnterDamageMode}
        >
          Commander damage
        </button>
      )}
    </section>
  )
}
