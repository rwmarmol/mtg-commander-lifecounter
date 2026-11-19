import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('App', () => {
  it('renders the title', () => {
    expect(renderToString(<App />)).toContain('MTG Commander Life Counter')
  })
})
