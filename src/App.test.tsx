import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { App } from './App'
import type { MatchStorage } from './storage'

const emptyStorage: MatchStorage = { load: () => null, save: () => {}, clear: () => {} }

describe('App', () => {
  it('opens on the match grid with 4 default players when nothing is saved', () => {
    const html = renderToString(<App storage={emptyStorage} />)
    expect(html).toContain('Player 4')
    expect(html).toContain('>40<')
  })
})
