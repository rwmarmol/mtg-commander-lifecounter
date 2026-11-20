import { useState } from 'react'
import type { MatchState } from './game'
import { createLocalStorageMatchStorage } from './storage'
import type { MatchStorage } from './storage'
import { SetupScreen } from './ui/SetupScreen'

type AppProps = {
  storage?: MatchStorage
}

export function App({ storage }: AppProps) {
  const [store] = useState(() => storage ?? createLocalStorageMatchStorage())
  const [match, setMatch] = useState<MatchState | null>(() => store.load())

  function start(next: MatchState) {
    store.save(next)
    setMatch(next)
  }

  if (!match) return <SetupScreen onStart={start} />
  return (
    <main>
      {match.players.map((p) => (
        <p key={p.id}>
          {p.name}: <span className="number">{p.life}</span>
        </p>
      ))}
    </main>
  )
}
