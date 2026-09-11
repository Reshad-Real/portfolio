import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Deployed to https://reshad-real.github.io/portfolio/
// `base` is overridable so the same source can be hosted at a domain root.
const base = process.env.VITE_BASE ?? '/portfolio/'

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) return 'react-vendor'
          if (id.includes('/components/games/')) return 'arcade'
          if (id.includes('/lib/gl') || id.includes('/lib/geometry')) return 'gl'
          return undefined
        },
      },
    },
  },
})
