import { useState } from 'react'
import type { Player, PlayerSetup } from '../game'
import { PLAYER_COLORS } from './colors'

type PlayerEditorProps = {
  player: Player
  onSave: (patch: PlayerSetup) => void
}

/** Edits a draft of name, commander and color; nothing changes until "Done". */
export function PlayerEditor({ player, onSave }: PlayerEditorProps) {
  const [draft, setDraft] = useState<PlayerSetup>({
    name: player.name,
    commander: player.commander,
    color: player.color,
  })

  return (
    <div className="editor">
      <input
        aria-label="Name"
        placeholder="Name"
        value={draft.name}
        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
      />
      <input
        aria-label="Commander"
        placeholder="Commander (optional)"
        value={draft.commander}
        onChange={(e) => setDraft({ ...draft, commander: e.target.value })}
      />
      <div className="swatches">
        {PLAYER_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            aria-label={`Color ${color}`}
            aria-pressed={draft.color === color}
            className={draft.color === color ? 'swatch selected' : 'swatch'}
            style={{ background: color }}
            onClick={() => setDraft({ ...draft, color })}
          />
        ))}
      </div>
      <button type="button" className="overlay-button" onClick={() => onSave(draft)}>
        Done
      </button>
    </div>
  )
}
