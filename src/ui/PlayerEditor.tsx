import { useEffect, useState } from 'react'
import type { Player, PlayerSetup } from '../game'
import { lookupCommander } from '../scryfall'
import type { CommanderArt } from '../scryfall'
import { PLAYER_COLORS } from './colors'
import { useDebouncedValue } from './useDebouncedValue'

/** Wait for typing to pause before asking Scryfall, to stay well under its rate limit. */
export const LOOKUP_DEBOUNCE_MS = 600

type PlayerEditorProps = {
  player: Player
  onSave: (patch: PlayerSetup) => void
}

type Lookup =
  | { status: 'idle' }
  | { status: 'found'; query: string; card: CommanderArt }
  | { status: 'failed'; query: string }

/** Edits a draft of name, commander and color; nothing changes until "Done". */
export function PlayerEditor({ player, onSave }: PlayerEditorProps) {
  const [draft, setDraft] = useState<PlayerSetup>({
    name: player.name,
    commander: player.commander,
    color: player.color,
  })
  const [lookup, setLookup] = useState<Lookup>({ status: 'idle' })

  const query = draft.commander.trim()
  const debouncedQuery = useDebouncedValue(query, LOOKUP_DEBOUNCE_MS)
  // The commander as saved: its art is already known, so opening the editor costs no request.
  const unchanged = query === player.commander

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery === player.commander) return
    let cancelled = false
    lookupCommander(debouncedQuery).then((result) => {
      if (cancelled) return
      setLookup(
        result.ok
          ? { status: 'found', query: debouncedQuery, card: result.card }
          : { status: 'failed', query: debouncedQuery },
      )
    })
    return () => {
      cancelled = true
    }
  }, [debouncedQuery, player.commander])

  // Only trust a result that belongs to what is currently typed.
  const current =
    (lookup.status === 'found' || lookup.status === 'failed') && lookup.query === query
      ? lookup
      : null
  const pending = !unchanged && query !== '' && current === null

  function save() {
    if (unchanged) {
      onSave(draft)
    } else if (current?.status === 'found') {
      onSave({ ...draft, commander: current.card.name, artUrl: current.card.artUrl })
    } else {
      // Empty, failed or still loading: keep the color. A failed lookup never blocks the match.
      onSave({ ...draft, artUrl: null })
    }
  }

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
      <div className="lookup-status" role="status">
        {pending && 'Searching…'}
        {current?.status === 'found' && `Found: ${current.card.name}`}
        {current?.status === 'failed' && 'Commander not found, using color'}
      </div>
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
      <button type="button" className="overlay-button" onClick={save}>
        Done
      </button>
    </div>
  )
}
