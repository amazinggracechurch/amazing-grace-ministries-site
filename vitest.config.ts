import path from 'node:path'
import { defineConfig } from 'vitest/config'

// Mirrors the "@/..." path alias from tsconfig so unit tests can import
// modules the same way the Next build does.
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
})
