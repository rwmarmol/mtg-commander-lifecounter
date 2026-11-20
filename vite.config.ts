import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  base: '/mtg-commander-lifecounter/',
  plugins: [react()],
  test: {
    environment: 'node',
  },
})
