import { useState } from 'react'
import { COMMANDER_DAMAGE_LETHAL, isEliminated } from '../game'
import type { LifeDelta, Player, PlayerSetup } from '../game'
import { PlayerEditor } from './PlayerEditor'

export type PanelMode = 'normal' | 'receiving' | 'source'

type PlayerPanelProps = {
  player: Player
  /** All players, used to name the sources of commander damage badges. */
  players: readonly Player[]
  rotated: boolean
  /** Outer corner of the grid, in the panel's own frame; away from the center menu. */
  side: 'left' | 'right'
  mode: PanelMode
  /** The player receiving damage while in damage mode. */
  receiver: Player | null
  onLifeChange: (delta: LifeDelta) => void
  onDamageChange: (delta: LifeDelta) => void
  onEnterDamageMode: () => void
  onExitDamageMode: () => void
  onUpdate: (patch: PlayerSetup) => void
  onRevive: () => void
}

export function PlayerPanel({
  player,
  players,
  rotated,
  side,
  mode,
  receiver,
  onLifeChange,
  onDamageChange,
  onEnterDamageMode,
  onExitDamageMode,
  onUpdate,
  onRevive,
}: PlayerPanelProps) {
  const [editing, setEditing] = useState(false)
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
      {player.artUrl && (
        <img
          className="art"
          src={player.artUrl}
          alt=""
          onError={(e) => e.currentTarget.remove()}
        />
      )}
      <button
        type="button"
        className="zone minus"
        aria-label={`${player.name} minus 1 ${mode === 'source' ? 'commander damage' : 'life'}`}
        disabled={zonesDisabled}
        onClick={() => onZone(-1)}
      >
        <span className="sign">−</span>
      </button>
      <button
        type="button"
        className="zone plus"
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
            <button type="button" className="label edit" onClick={() => setEditing(true)}>
              {label}
            </button>
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
      {mode === 'normal' && eliminated && (
        <button type="button" className="mode-button return" onClick={onRevive}>
          Revive
        </button>
      )}
      {mode === 'normal' && !eliminated && (
        <button type="button" className="mode-button" onClick={onEnterDamageMode}>
          Commander damage
        </button>
      )}
      {editing && (
        <PlayerEditor
          player={player}
          side={side}
          onSave={(patch) => {
            onUpdate(patch)
            setEditing(false)
          }}
        />
      )}
    </section>
  )
}
