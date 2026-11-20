import { useState } from 'react'
import { createLocalStorageMatchStorage } from './storage'
import type { MatchStorage } from './storage'
import { MatchScreen } from './ui/MatchScreen'
import { createDefaultMatch } from './ui/defaultMatch'

type AppProps = {
  storage?: MatchStorage
}

export function App({ storage }: AppProps) {
  const [store] = useState(() => storage ?? createLocalStorageMatchStorage())
  const [initialMatch] = useState(() => store.load() ?? createDefaultMatch())

  return (
    <>
      <MatchScreen initialMatch={initialMatch} storage={store} />
      <div className="rotate-notice">Rotate your device to landscape</div>
    </>
  )
}
