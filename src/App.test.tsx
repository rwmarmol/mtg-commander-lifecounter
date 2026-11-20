import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { App } from './App'
import type { MatchStorage } from './storage'

const emptyStorage: MatchStorage = { load: () => null, save: () => {}, clear: () => {} }

describe('App', () => {
  it('shows the setup screen when no match is saved', () => {
    expect(renderToString(<App storage={emptyStorage} />)).toContain('Start')
  })
})
