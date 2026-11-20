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

  if (!match) return <SetupScreen onStart={setMatch} />
  return <MatchScreen initialMatch={match} storage={store} />
}
