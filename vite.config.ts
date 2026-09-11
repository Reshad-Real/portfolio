import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Deployed to https://reshad-real.github.io/portfolio/
// `base` is overridable so the same source can be hosted at a domain root.
const base = process.env.VITE_BASE ?? '/portfolio/'
// fileURLToPath, because a raw URL pathname keeps the percent-encoding that
// Windows paths with spaces produce.
const here = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    reportCompressedSize: false,
    rollupOptions: {
      // The arcade is its own page, so its games never weigh on the portfolio.
      input: {
        main: resolve(here, 'index.html'),
        arcade: resolve(here, 'arcade.html'),
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) return 'react-vendor'
          return undefined
        },
      },
    },
  },
})
