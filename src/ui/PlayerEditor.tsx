import { useEffect, useState } from 'react'
import type { Player, PlayerSetup } from '../game'
import { searchCommanders } from '../scryfall'
import type { CommanderArt } from '../scryfall'
import { PLAYER_COLORS } from './colors'
import { useDebouncedValue } from './useDebouncedValue'

/** Wait for typing to pause before asking Scryfall, to stay well under its rate limit. */
export const LOOKUP_DEBOUNCE_MS = 600

type PlayerEditorProps = {
  player: Player
  onSave: (patch: PlayerSetup) => void
}

type Search =
  | { status: 'found'; query: string; cards: CommanderArt[] }
  | { status: 'failed'; query: string }

/** Edits a draft of name, commander and color; nothing changes until "Done". */
export function PlayerEditor({ player, onSave }: PlayerEditorProps) {
  const [draft, setDraft] = useState<PlayerSetup>({
    name: player.name,
    commander: player.commander,
    color: player.color,
  })
  const [search, setSearch] = useState<Search | null>(null)
  // The card the player tapped in the list; typing again clears it.
  const [selected, setSelected] = useState<CommanderArt | null>(null)

  const query = draft.commander.trim()
  const debouncedQuery = useDebouncedValue(query, LOOKUP_DEBOUNCE_MS)
  // The commander as saved: its art is already known, so opening the editor costs no request.
  const unchanged = query === player.commander

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery === player.commander) return
    let cancelled = false
    searchCommanders(debouncedQuery).then((result) => {
      if (cancelled) return
      setSearch(
        result.ok
          ? { status: 'found', query: debouncedQuery, cards: result.cards }
          : { status: 'failed', query: debouncedQuery },
      )
    })
    return () => {
      cancelled = true
    }
  }, [debouncedQuery, player.commander])

  // Only show results that belong to what is currently typed.
  const current = search && search.query === query ? search : null
  const pending = !unchanged && query !== '' && !selected && current === null

  function choose(card: CommanderArt) {
    setSelected(card)
    setDraft({ ...draft, commander: card.name })
  }

  function save() {
    if (selected && selected.name === query) {
      onSave({ ...draft, commander: selected.name, artUrl: selected.artUrl })
    } else if (unchanged) {
      onSave(draft)
    } else {
      // Nothing picked: keep the color. A failed search never blocks the match.
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
        onChange={(e) => {
          setSelected(null)
          setDraft({ ...draft, commander: e.target.value })
        }}
      />
      <div className="lookup-status" role="status">
        {pending && 'Searching…'}
        {!selected && current?.status === 'failed' && 'Commander not found, using color'}
      </div>
      {!selected && current?.status === 'found' && (
        <ul className="results">
          {current.cards.map((card) => (
            <li key={card.name}>
              <button type="button" className="result" onClick={() => choose(card)}>
                <img className="avatar" src={card.artUrl} alt="" />
                <span className="result-name">{card.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
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
