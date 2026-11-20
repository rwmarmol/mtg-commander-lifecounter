import { useState } from 'react'
import type { MatchState } from './game'
import { createLocalStorageMatchStorage } from './storage'
import type { MatchStorage } from './storage'
import { MatchScreen } from './ui/MatchScreen'
import { SetupScreen } from './ui/SetupScreen'

type AppProps = {
  storage?: MatchStorage
}

export function App({ storage }: AppProps) {
  const [store] = useState(() => storage ?? createLocalStorageMatchStorage())
  const [match, setMatch] = useState<MatchState | null>(() => store.load())

  const newGame = () => {
    store.clear()
    setMatch(null)
  }

  return (
    <>
      {match ? (
        <MatchScreen initialMatch={match} storage={store} onNewGame={newGame} />
      ) : (
        <SetupScreen onStart={setMatch} />
      )}
      <div className="rotate-notice">Rotate your device to landscape</div>
    </>
  )
}
